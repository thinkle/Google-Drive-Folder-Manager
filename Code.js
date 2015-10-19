function doGet () {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
}

function getFolders () {
  Logger.log('Testing getFolders');
}

function getFolderString (f) {
  folder_string = '=hyperlink("'+f.getUrl()+'","'+f.getName()+'")'
  return folder_string
}

function getFolderChildren (root) {  
  childIterator = root.getFolders()
  children = []
  while (childIterator.hasNext()) {
    child = childIterator.next()
    other_parent_iterator = child.getParents()
    has_children = child.getFolders().hasNext() 
    other_parents = []
    while (other_parent_iterator.hasNext()) {
      op = other_parent_iterator.next();
      if (op.getId() != root.getId()) {
	other_parents.push([op.getId(),op.getName(),op.getUrl()]);
      }
    }
    children.push([child.getId(),child.getName(),child.getUrl(),other_parents,has_children]);
  }
  return [root.getId(),children]
}



function getFolder (folderID) {
  root = DriveApp.getFolderById(folderID)
  return getFolderChildren(root)
}


function getRootFolder () {
  root = DriveApp.getRootFolder();
  return getFolderChildren(root)
}

function removeParent (child, parent) {
  Logger.log('Got call to remove parent '+parent+' from child '+child);
  parentFolder = DriveApp.getFolderById(parent);
  childFolder = DriveApp.getFolderById(child);
  // make sure we don't remove the last parent
  // we don't want to create any orphans
  var allParentsIterator = childFolder.getParents()
  allParentsIterator.next() // First parent...
  if (allParentsIterator.hasNext()) {
    // As long as there is a second parent, we are happy...
    parentFolder.removeFolder(childFolder);
    return [child,parent,true]
  }
  else {
    Logger.log('Refusing to orphan '+child+' by removing parent '+parent)
    throw "Refusing to Orphan "+childFolder.getName()+" by removing last parent, "+parentFolder.getName();
  }
}

function testRemoveParent () {
  f = DriveApp.createFolder('Test Folder');
  f2parents = DriveApp.createFolder('Test Folder 2');
  f.addFolder(f2parents);
  // Now f2parents is in Root + f
  // It should be possible to remove f from root
  removeParent(f.getId(),DriveApp.getRootFolder().getId());
  // It should *not* be possible to remove f2 from root
  // because that is its only home :(
  try {
    removeParent(f2.getId(),DriveApp.getRootFolder().getId());
  }
  catch (err) {
    Logger.log('Successfully threw error trying to orphan file.')
    Logger.log('Error',err)
  }
  finally {
    f.setTrashed(true);
    f2.setTrashed(true);
  }
}


function removeFromRoot (child) {
  root = DriveApp.getRootFolder().getId()
  return removeParent(child,root)
}

function addMultipleToRoot (children) {
  return addMultipleToParent(children,DriveApp.getRootFolder().getId())
}

function addMultipleToParent (children, parent) {
  childArray = [];
  parentFolder = DriveApp.getFolderById(parent)
  for (i=0; i<children.length; i++) {
    child = DriveApp.getFolderById(children[i]);
    Logger.log('Got folder '+child+' for ID '+children[i])
    parentFolder.addFolder(child);
    childArray.push([child.getId(),child.getName(),child.getUrl()])
  }
  return [childArray,[parentFolder.getId(),parentFolder.getName(),parentFolder.getUrl()]]
}


function getMyFolders () {
  Logger.log('Calling getFolders')
  folders = DriveApp.getFolders();  
  sheet = SpreadsheetApp.getActiveSheet()
  var cells = sheet.getRange(1,1,1,4);
  cells.setValues([["Folder","ID","Owner","Parents"]])
  row = 1
  while (folders.hasNext()) {    
    folder = folders.next();
    if (folder.getOwner().getEmail() == Session.getActiveUser().getEmail()) {
      row += 1
      name = folder.getName();
      id = folder.getId();
      vals = [getFolderString(folder),id,folder.getOwner().getEmail()]
      fparents = folder.getParents()
      while (fparents.hasNext()) {
        parent = fparents.next();
        vals.push(getFolderString(parent))
      }
      cell = sheet.getRange(row,1,1,vals.length)
      cell.setValues([vals]);
      Logger.log('Folder '+name+' '+id);
    }}
  Logger.log('Done iterating through folders');
}

function getOAuthToken() {
  DriveApp.getRootFolder();
  return ScriptApp.getOAuthToken();
}
