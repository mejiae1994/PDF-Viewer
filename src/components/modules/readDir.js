const path = require('path')
const fs = require('fs')

function findFilesInDir(startPath,filter){
    let results = [];

    if (!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }
    
    var files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()){
            results = results.concat(findFilesInDir(filename,filter)); //recurse
        }
        else if (filename.indexOf(filter)>=0) {
            console.log('-- found: ',filename);
            results.push(filename);
        }
    }
    return results;
}

module.exports = findFilesInDir;