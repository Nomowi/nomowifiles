var fs = require('fs');
var path = require('path');
function list(src,callback)
{
	if(src == undefined){
		throw new Error("No source to list (Missing src argument as string)");
	}
	fs.readdir(src, function(err,files){
		if(err){
			callback(err,null);
			return false;
		}
		var list = {
			files : {},
			filesHidden : {},
			folders : {},
			foldersHidden : {}
		}
		for (var i = 0; i < files.length; i++) {
			var fpath = path.join(src,files[i]);
			var stat = fs.lstatSync(fpath);
			if(stat.isFile()){
				stat.type = 'file';
				stat.stype = 'file';
			}else if(stat.isDirectory()){
				stat.type = 'folder';
				stat.stype = 'folder';
			}else if(stat.isSymbolicLink()){
				var spstat = fs.statSync(fpath);
				if(spstat.isDirectory()){
					stat.stype = 'folder';
				}else{
					stat.stype = 'file';
				}
				stat.type = 'link';
			}else if(stat.isBlockDevice()){
				stat.type = 'blockdevice';
				stat.stype = 'file';
			}else if(stat.isCharacterDevice()){
				stat.type = 'characterdevice';
				stat.stype = 'file';
			}else if(stat.isFIFO()){
				stat.type = 'fifo';
				stat.stype = 'file';
			}else if(stat.isSocket()){
				stat.type = 'socket';
				stat.stype = 'file';
			}
			if(files[i].substring(0,1) == '.' && stat.type == 'file'){
				list.filesHidden[fpath] = stat;
			}else if(files[i].substring(0,1) == '.' && stat.type == 'folder'){
				list.foldersHidden[fpath] = stat;
			}else if(stat.stype == 'file'){
				list.files[fpath] = stat;
			}else if(stat.stype == 'folder'){
				list.folders[fpath] = stat;
			}
		};
		callback(null,list);
	});
}
function noop() {}
/*
var deleteFolderRecursive = function(path,folder) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath,true);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		if(typeof folder != "undefined" && folder){fs.rmdirSync(path);}
	}
};
*/



function move(src, dst, cb) {
	function copyIfFailed(err) {
		if (!err) {
			return cb(null);
		}
		copy(src, dst, function(err) {
			if (!err) {
				// TODO 
				// should we revert the copy if the unlink fails?
				fs.unlink(src, cb);
			} else {
				cb(err);
			}
		});
	}

	cb = cb || noop;
	fs.stat(dst, function (err) {
		if (!err) {
			return cb(new Error("File " + dst + " exists."));
		}
		fs.rename(src, dst, copyIfFailed);
	});
}

function copy(src, dst, opts, cb) {
	if ('function' === typeof opts) {
		cb = opts;
		opts = null;
	}
	opts = opts || {};

	function copyHelper(err) {
		var is, os;

		if (!err && !(opts.replace || opts.overwrite)) {
			return cb(new Error("File " + dst + " exists."));
		}

		fs.stat(src, function (err, stat) {
			if (err) {
				return cb(err);
			}

			is = fs.createReadStream(src);
			os = fs.createWriteStream(dst);

			is.pipe(os);
			os.on('close', function (err) {
				if (err) {
					return cb(err);
				}

				fs.utimes(dst, stat.atime, stat.mtime, cb);
			});
		});
	}

	cb = cb || noop;
	fs.stat(dst, copyHelper);
}

module.exports = {
	getFiles : list
};