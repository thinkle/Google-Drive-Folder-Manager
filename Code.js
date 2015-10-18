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
  parentFolder.removeFolder(childFolder);
  return [child,parent,true]
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
