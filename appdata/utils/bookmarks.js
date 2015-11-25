var fs =  require('fs');
var path = require('path');
userdir=(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE)+"/";

var bookmarks_cache = [];
var bookmarks_cache_text = [];
var callbackupdate = null;
var updatesig = false;

function loadBookmarks(){
	getBookmarks();
}
function getBookmarks(){
	var bookmarks_tx = "\n";
	var bookmarks = [];
	//Revisamos si existe algun archivo de bookmarks
	bmksexist=fs.existsSync(userdir+"/.gtk-bookmarks");
	gtk3exist=fs.existsSync(userdir+"/.config/gtk-3.0/bookmarks");
	//Si existe cualquiera de los 2 lo leemos si existen los 2 leemos ambos
	if(bmksexist && gtk3exist){
		if(bmksexist){
			bookmarks_tx+=fs.readFileSync(userdir+"/.gtk-bookmarks", {encoding: "utf8"});
		}
		if(gtk3exist){
			bookmarks_tx+="\n"+fs.readFileSync(userdir+"/.config/gtk-3.0/bookmarks", {encoding: "utf8"});
		}
	}else{
		fs.createWriteStream(userdir+"/.gtk-bookmarks", { flags: 'w',encoding: null,mode: 0666 ,autoClose: true})
	}
	if(bookmarks_cache_text != bookmarks_tx){
		updatesig = true;
	}
	bookmarks_cache_text = bookmarks_tx;
	bookmarks=bookmarks_tx.split("\n");
	bookmarks[0]="file://"+userdir+" Carpeta personal";
	for (var i = 0; i < bookmarks.length; i++) {
		bookmarks[i]=decodeURIComponent(bookmarks[i]);
		if(bookmarks[i] == ""){bookmarks.splice(i,1);i--;}
	};
	bookmarks_cache = bookmarks;
	return bookmarks;
}
function bookmarksToHtml(){
	var html = "";
	var rgx = /(?:[a-zA-Z09]+:\/\/)(\S+) ?(.+)?/;
	for (var i = 0; i < bookmarks_cache.length; i++) {
		var bk = rgx.exec(bookmarks_cache[i]);
		if (bk != null) {
			html+='<div class="gk-dropdown-item bz nosel" sel="0" tdir="'+bk[1]+'"><div class="l gk-sidebar-icon"></div>'+path.basename(bk[2]||bk[1])+'</div>';
		};
	};
	return html;
}
function bookmarksOnUpdate (callback){
	if(callbackupdate == null){
		setInterval(function(){
			getBookmarks();
			if(updatesig){
				callbackupdate();
				updatesig = false;
			}
		},1000);
	}
	callbackupdate = callback;
}

module.exports = {
	getBookmarks : getBookmarks,
	loadBookmarks : loadBookmarks,
	bookmarksToHtml : bookmarksToHtml,
	bookmarksOnUpdate : bookmarksOnUpdate
}