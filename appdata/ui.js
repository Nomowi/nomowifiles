function is(w,m){if(m.substr(0,1) == "#"){if(m.substr(1,m.length-1) == w.target.id){return true;}else{return false;}}else if(m.substr(0,1) == "."){fl=w.target.classList.length;for (var i = 0; i < fl; i++){if(w.target.classList[i] == m.substr(1,m.length-1)){return true;break;}else if(i==w.target.classList.length){return false;}};}}
function closest(w,m) {tar=w.target;while (tar.tagName != "HTML") {if(m.substr(0,1) == "#"){if(m.substr(1,m.length-1) == tar.id){return tar;}}else if(m.substr(0,1) == "."){fl=tar.classList.length;for (var i = 0; i < fl; i++){if(tar.classList[i] == m.substr(1,m.length-1)){return tar;break;}};}tar = tar.parentNode;}return null;}
function isclosest(w,m) {tar=w.target;while (tar.tagName != "HTML") {if(m.substr(0,1) == "#"){if(m.substr(1,m.length-1) == tar.id){return true;}}else if(m.substr(0,1) == "."){fl=tar.classList.length;for (var i = 0; i < fl; i++){if(tar.classList[i] == m.substr(1,m.length-1)){return true;break;}};}tar = tar.parentNode;if(tar == null){return false;}}return false;}
function booltoint(w){if(w){return 1;}else{return 0;}}
function getID(w){return document.getElementById(w);}
function getClass(w){return document.getElementsByClassName(w);}
function show(e){e.style.display='block'};function hide(e){e.style.display='none'};ajax=[];
function str2hex(str){response="";for (var i = 0; i < str.length; i++) {hex=str.charCodeAt(i).toString(16);response+=("000"+hex).slice(-4);};return response;}
function hex2str(str){response="";hexes=str.match(/.{1,4}/g) || [];for (var i = 0; i < hexes.length; i++) {response+=String.fromCharCode(parseInt(hexes[i],16));};return response;}

var fs=require('fs');
var path = require('path');
var gui = require('nw.gui');
var exec = require('child_process').exec;
var u_bookmark = require('./utils/bookmarks.js');

var fileManager = require('./file.js');

path.split=function(w){
	w=w.split('/');
	w[0]='/';
	if(w[w.length-1] == ""){w.splice(w.length-1,1);}
	return w;
};

var settings = {};
var main_window = {};
var tabs = {};

/*--Settings--*/
//Directorio de usuario
settings.userdir=(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE)+"/";
settings.showhidden=(typeof localStorage["showhidden"] == "undefined") ? false:localStorage["showhidden"];//Mostrar archivos ocultos
settings.view=(typeof localStorage["view"] == "undefined") ? "list":localStorage["view"]; //Obtenemos la configuracion de la vista
settings.iconsize=(settings.view == 'list')? 16:64;

//Main window
main_window=gui.Window.get(0);
main_window.maximized=false;
main_window.on('maximize',function(){
	main_window.maximized=true;
	//resizeWEvent();
})
main_window.on('unmaximize',function(){
	main_window.maximized=false;
	//resizeWEvent();
})
main_window.on('resize',function(){
	//resizeWEvent();
})

keyh={};
keyh.shift=false;
keyh.ctrl=false;
keyh.altk=false;

ui = {};

window.addEventListener('load',function(){
	loadElements();
	initBookmarks();
	tabs.new(settings.userdir);
	window.addEventListener("click",function(e){
		if(is(e,'.closewindow')){window.close();}
		if(is(e,'.maxwindow')){if(!main_window.maximized){main_window.maximize();}else{main_window.maximized=false;main_window.unmaximize();}}
		if(is(e,'.minwindow')){main_window.minimize();}

		//Left bar dropdown
		/*--Bookmarks--*/
		//Ir al bookmark
		if(is(e,".gk-dropdown")){
			sixl = !Boolean(parseInt(e.target.getAttribute("opened")));
			e.target.setAttribute("opened",booltoint(sixl))
			e.target.nextElementSibling.setAttribute("opened",booltoint(sixl))
		}
		if(isclosest(e,'.gk-dropdown-item')){
			var fpath = closest(e,'.gk-dropdown-item').getAttribute('tdir');
			tabs.go(tabs.currentTab,fpath);
		}

		/*--Tabs--*/
		if(is(e,'#addtab')){
			tabs.new(settings.userdir);
		}
		if(!is(e,'.closetab') && isclosest(e,'.tab')){
			focusTab(closest(e,'.tab').getAttribute('tabid'));
		}
		if(is(e,'.closetab')){
			tabs.close(closest(e,'.tab').getAttribute('tabid'));
		}
		if(is(e,'#hisback')){
			tabs.historyPrev(tabs.currentTab);
		}
		if(is(e,'#hisnext')){
			tabs.historyNext(tabs.currentTab);
		}
		if(isclosest(e,'.file')){
			var fdom = closest(e,'.file');
			var ftype = fdom.getAttribute('type');
			var ishidden = (fdom.getAttribute('hidden') == 'true');
			var fpath = fdom.getAttribute('path');
			if(e.detail == 2){
				if(ftype == 'folder'){
					tabs.go(tabs.currentTab,fdom.getAttribute('path'));
				}else if(ftype == 'file'){
					var popen = fdom.getAttribute('path');
					exec('xdg-open "'+popen+'"',function(err){
						if(err){
							console.log(err);
						}
					});
				}
			}
		}
	})
	window.addEventListener('keydown', function(e){
		if(e.keyIdentifier === 'F5'){window.location.reload();}
		if(e.keyIdentifier === 'F12'){main_window.showDevTools();}
		if(e.keyCode == 16){keyh.shift=true;}
		if(e.keyCode == 17){keyh.ctrl=true;}
		if(e.keyCode == 18){keyh.altk=true;}
	});
	window.addEventListener('keyup', function(e){
		if(e.keyCode == 16){keyh.shift=false;}
		if(e.keyCode == 17){keyh.ctrl=false;}
		if(e.keyCode == 18){keyh.altk=false;}
	});
});

function loadElements(){
	ui.bookmarks = document.getElementById('bookmarks');
	ui.tabs 	 = document.getElementById('tabs');
	ui.tspaces 	 = document.getElementById('tspaces');
	ui.hisback 	 = document.getElementById('hisback');
	ui.hisnext 	 = document.getElementById('hisnext');
}
function initBookmarks(){
	u_bookmark.loadBookmarks();
	u_bookmark.bookmarksOnUpdate(function(){
		ui.bookmarks.innerHTML = u_bookmark.bookmarksToHtml();
	})
}

//Tabs

tabs.tabs = [];
tabs.lid = 0;
tabs.currentTab = 0;
tabs.new = function(dir){
	unfocusTabs();
	tabs.tabs.push({
		id:tabs.lid,
		path:dir,
		history:[dir],
		history_pointer:0,
		focused:true,
		tabDOM:null,
		containerDOM:null,
		listed:{},
		selected:[]
	});
	var newtab = tabs.tabs[tabs.tabs.length-1];
	tabInit(newtab.id,path.basename(dir),newtab);
	tabs.go(newtab.id,dir);
	focusTab(newtab.id);
	tabs.lid++;
}
tabs.close = function(tabid){
	for (var i = 0; i < tabs.tabs.length; i++) {
		if(tabs.tabs[i].id == parseInt(tabid)){
			tabs.tabs[i].tabDOM.remove();
			tabs.tabs[i].containerDOM.remove();
			console.log(tabs.tabs[i].id);
			if(tabs.tabs[i].focused == true){
				if(typeof tabs.tabs[i-1] != 'undefined'){
					focusTab(tabs.tabs[i-1].id);
				}else if(typeof tabs.tabs[i+1] != 'undefined'){
					focusTab(tabs.tabs[i+1].id);
				}
			}
			tabs.tabs.splice(i,1);
			break;
		}
	};
	if(tabs.tabs.length < 1){
		historyButtons(false,false);
	}
}
tabs.go = function(tabid,dir){
	if(tabs.tabs.length == 0){
		tabs.new(dir);
		return false;
	}
	for (var i = 0; i < tabs.tabs.length; i++) {
		if(tabs.tabs[i].id == tabid){
			tabs.tabs[i].path = dir;
			tabs.tabs[i].tabDOM.querySelector('.tabname').innerHTML = path.basename(dir);
			tabs.historyPush(tabid,dir);
			fileManager.getFiles(dir,function(err,files){
				this.tabobj.listed = files;
				displayFiles(this.tabobj.id);
			}.bind({tabobj:tabs.tabs[i]}));
			var fbu = false;
			var sbu = false;
			if(tabs.tabs[i].history.length > 1){
				if(tabs.tabs[i].history_pointer > 0){fbu = true;}
				if(tabs.tabs[i].history_pointer < tabs.tabs[i].history.length-1){sbu = true;}
			}
			historyButtons(fbu,sbu);
			break;
		}
	};
}
tabs.reload = function(tabid){}
tabs.historyNext = function(tabid){
	for (var i = 0; i < tabs.tabs.length; i++) {
		if(tabs.tabs[i].id == tabid){
			if(tabs.tabs[i].history_pointer < tabs.tabs[i].history.length-1){
				console.log('nx')
				tabs.tabs[i].history_pointer += 1;
				var dir = tabs.tabs[i].history[tabs.tabs[i].history_pointer];
				tabs.tabs[i].path = dir;
				tabs.tabs[i].tabDOM.querySelector('.tabname').innerHTML = path.basename(dir);
				fileManager.getFiles(dir,function(err,files){
					this.tabobj.listed = files;
					displayFiles(this.tabobj.id);
				}.bind({tabobj:tabs.tabs[i]}));
			}
			var fbu = false;
			var sbu = false;
			if(tabs.tabs[i].history.length > 1){
				if(tabs.tabs[i].history_pointer > 0){fbu = true;}
				if(tabs.tabs[i].history_pointer < tabs.tabs[i].history.length-1){sbu = true;}
			}
			historyButtons(fbu,sbu);
			break;
		}
	};
}
tabs.historyPrev = function(tabid){
	for (var i = 0; i < tabs.tabs.length; i++) {
		if(tabs.tabs[i].id == tabid){
			if(tabs.tabs[i].history_pointer > 0){
				tabs.tabs[i].history_pointer -= 1;
				var dir = tabs.tabs[i].history[tabs.tabs[i].history_pointer];
				tabs.tabs[i].path = dir;
				tabs.tabs[i].tabDOM.querySelector('.tabname').innerHTML = path.basename(dir);
				fileManager.getFiles(dir,function(err,files){
					this.tabobj.listed = files;
					displayFiles(this.tabobj.id);
				}.bind({tabobj:tabs.tabs[i]}));
			}
			var fbu = false;
			var sbu = false;
			if(tabs.tabs[i].history.length > 1){
				if(tabs.tabs[i].history_pointer > 0){fbu = true;}
				if(tabs.tabs[i].history_pointer < tabs.tabs[i].history.length-1){sbu = true;}
			}
			historyButtons(fbu,sbu);
			break;
		}
	};
}
tabs.historyPush = function(tabid,dir){
	for (var i = 0; i < tabs.tabs.length; i++) {
		if(tabs.tabs[i].id == tabid){
			var p = tabs.tabs[i].history_pointer;
			var l = tabs.tabs[i].history.length;
			if(dir != tabs.tabs[i].history[p]){
				if(p == l-1){
					tabs.tabs[i].history.push(dir);
					tabs.tabs[i].history_pointer +=1;
				}else{
					tabs.tabs[i].history = tabs.tabs[i].history.slice(0,p+1);
					tabs.tabs[i].history.push(dir);
					tabs.tabs[i].history_pointer +=1;
				}
			}
		}
	};
}

function displayFiles(tabid){
	for (var i = 0; i < tabs.tabs.length; i++) {
		if(tabs.tabs[i].id == tabid){
			var ht = '';
			//Folder
			for(fpath in tabs.tabs[i].listed.folders){
				ht+="<div class='file nosel' path='"+fpath+"' type='folder'><div class='file-icon'>D</div><div class='file-name'>"+path.basename(fpath)+"</div></div>";
			}
			if(settings.showhidden){
				for(fpath in tabs.tabs[i].listed.foldersHidden){
					ht+="<div class='file nosel' path='"+fpath+"' type='folder' hidden='true'><div class='file-icon'>D</div><div class='file-name'>"+path.basename(fpath)+"</div></div>";
				}
			}
			//Files
			for(fpath in tabs.tabs[i].listed.files){
				ht+="<div class='file nosel' path='"+fpath+"' type='file'><div class='file-icon'>F</div><div class='file-name'>"+path.basename(fpath)+"</div></div>";
			}
			if(settings.showhidden){
				for(fpath in tabs.tabs[i].listed.filesHidden){
					ht+="<div class='file nosel' path='"+fpath+"' type='file' hidden='true'><div class='file-icon'>F</div><div class='file-name'>"+path.basename(fpath)+"</div></div>";
				}
			}
			tabs.tabs[i].containerDOM.innerHTML=ht;
		}
	};
}

function tabInit(tabid,tabname,tabobj){
	//Tab title
	var tab = document.createElement('div');
	tab.className = 'tab bz';
	tab.setAttribute('active','1');
	tab.setAttribute('tabid',tabid);
	tab.innerHTML = "<div class='tabname'>"+tabname+"</div><div class='closetab'>&#xF00D;</div>"
	
	//Tab container
	var fileview = document.createElement('div');
	fileview.className = 'fileview';
	fileview.setAttribute('tabid',tabid);
	fileview.setAttribute('active','1');
	fileview.setAttribute('view','list');

	ui.tabs.appendChild(tab);
	ui.tspaces.appendChild(fileview);

	tabobj.tabDOM = tab;
	tabobj.containerDOM = fileview;
}

function unfocusTabs(){
	for (var i = 0; i < tabs.tabs.length; i++) {
		tabs.tabs[i].focused = false;
		tabs.tabs[i].tabDOM.setAttribute('active','0');
		tabs.tabs[i].containerDOM.setAttribute('active','0');
	};
}

function focusTab(tabid){
	unfocusTabs();
	for (var i = 0; i < tabs.tabs.length; i++) {
		if(tabs.tabs[i].id == parseInt(tabid)){
			tabs.tabs[i].focused = true;
			tabs.tabs[i].tabDOM.setAttribute('active','1');
			tabs.tabs[i].containerDOM.setAttribute('active','1');
			tabs.currentTab = parseInt(tabid);
			var fbu = false;
			var sbu = false;
			if(tabs.tabs[i].history.length > 1){
				if(tabs.tabs[i].history_pointer > 0){fbu = true;}
				if(tabs.tabs[i].history_pointer < tabs.tabs[i].history.length-1){sbu = true;}
			}
			historyButtons(fbu,sbu);
			break;
		}
	};
}

/*History*/
function historyButtons(back,next){
	ui.hisback.setAttribute('active',back);
	ui.hisnext.setAttribute('active',next);
}


