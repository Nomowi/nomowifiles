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
var net = require('net');
var Thumbnail = require('thumbnail');
var sizeOfImage = require('image-size');
path.split=function(w){
	w=w.split('/');
	w[0]='/';
	if(w[w.length-1] == ""){w.splice(w.length-1,1);}
	return w;
};
var gui = require('nw.gui');
var exec = require('child_process').exec;
var fsw = require('./filesystem.js');
var icons = require('./x11icons.js');
var mime = require('./mimetypes.js');

var app={};
app.bookmarks=[];
app.lbookmarks="";
app.scrollnb = false;
var ui={
	currenttab:1
};
var tabs={
	tabcid:0,
	tabnumb:0,
	history:{}
};

//Obtenemos el directorio del ususario
app.userdir=(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE)+"/";

/*--Configuraciones de la vista--*/
app.showhidden=(typeof localStorage["showhidden"] == "undefined") ? false:localStorage["showhidden"];//Mostrar archivos ocultos
app.view=(typeof localStorage["view"] == "undefined") ? "list":localStorage["view"]; //Obtenemos la configuracion de la vista
app.iconsize=(app.view == 'list')? 16:64;
/*--Ventana--*/
app.main_w=gui.Window.get(0);
app.maximized=false;

app.main_w.on('maximize',function(){
	app.maximized=true;
	resizeWEvent();
})
app.main_w.on('unmaximize',function(){
	app.maximized=false;
	resizeWEvent();
})
app.main_w.on('resize',function(){
	resizeWEvent();
})

function resizeWEvent(){
	setTimeout(function(){
		tabcont=ui.files.querySelector('[tabid="'+ui.currenttab+'"]');
		thumbnailsShow(tabcont);
	},100)
}

keyh=[]
keyh.shift=false;
keyh.ctrl=false;
keyh.altk=false;

window.addEventListener('load',function(){
	
	ui.loadElements();
	addTab(app.userdir);
	setInterval(function(){
		loadBookmarks();
	},2000);
	setInterval(function(){
		showBookmarks();
		bookmarksCheck();
	},200);
	loadBookmarks();
	showBookmarks();
	setView(app.view);
	window.addEventListener('contextmenu', function(e) {
		return false;
	});
	window.addEventListener("click",function(e){
		/*--Controles de la ventana--*/
		if(is(e,'.closewindow')){window.close();}
		if(is(e,'.maxwindow')){if(!app.maximized){app.main_w.maximize();}else{app.maximized=false;app.main_w.unmaximize();}}
		if(is(e,'.minwindow')){app.main_w.minimize();}
		//Click en la barra de direccion
		if((is(e,'#navinput-b') || is(e,'#navinput')) && !app.scrollnbsg){
			ui.navinput_c.setAttribute('editmode','1');
			ui.navinput.focus();
		}else{
			ui.navinput_c.setAttribute('editmode','0');
		}
		if(is(e,'.nav-dir') && !app.scrollnbsg){
			ev_path=e.target.getAttribute('path');
			goToDir(ui.currenttab,ev_path);
			tabHistoryPush(ui.currenttab,ev_path);
		}
		//Añadir pestaña
		if(is(e,'.addtab')){
			addTab(app.userdir);
		}
		//Cambiar de pestaña
		if(isclosest(e,'.tab')){
			tabid=closest(e,'.tab').getAttribute('tabid');
			showTab(tabid);
		}
		//Cerrar de pestaña
		if(is(e,'.closetab')){
			tabid=closest(e,'.tab').getAttribute('tabid');
			removeTab(tabid);
		}
		//Seleccionar archivo
		if( ((isclosest(e,'.f-icon') || isclosest(e,'.f-name')) && app.view == 'mosaic') || (isclosest(e,'.file-e') && app.view == 'list')){
			if(true){
				tabcont=ui.files.querySelector('[tabid="'+ui.currenttab+'"]');
				files=tabcont.querySelectorAll('.file-e');
				for (var i = 0; i < files.length; i++) {
					files[i].setAttribute('sel','0');
				};
			}
			target=closest(e,'.file-e');
			if(e.detail==2){
				if(target.getAttribute('xtype') == "dir"){
					tab=ui.tabs.querySelector('[tabid="'+ui.currenttab+'"]');
					dir=tab.getAttribute('dir')+target.getAttribute('file')+"/";
					goToDir(ui.currenttab,dir);
					tabHistoryPush(ui.currenttab,dir);
				}else if(target.getAttribute('xtype') == "file"){
					tab=ui.tabs.querySelector('[tabid="'+ui.currenttab+'"]');
					dir=tab.getAttribute('dir')+hex2str(target.getAttribute('file'));
					//dir=dir.replace(/[']+/g, "\\'");
					dir=dir.replace(/[""]+/g, '\\"')
					exec('xdg-open "'+dir+'"',function(err){
						if(err){
							console.log(err);
						}
					});
				}
			}
			target.setAttribute('sel','1');
		}else if(isclosest(e,'.tabcont')){
			if(true){
				tabcont=ui.files.querySelector('[tabid="'+ui.currenttab+'"]');
				files=tabcont.querySelectorAll('.file-e');
				for (var i = 0; i < files.length; i++) {
					files[i].setAttribute('sel','0');
				};
			}
		}
		//Cambiar la vista
		if(is(e,'.view-btn')){
			view=e.target.getAttribute('view');
			setView(view);
		}
		/*--Bookmarks--*/
		//Ir al bookmark
		if(isclosest(e,'.gk-dropdown-item')){
			tdir=closest(e,'.gk-dropdown-item').getAttribute('tdir');
			if(ui.tabs.childElementCount > 0){
				goToDir(ui.currenttab,tdir);
			}else{
				addTab(tdir);
				goToDir(ui.currenttab,tdir);
			}
			tabHistoryPush(ui.currenttab,tdir);
		}
		if(is(e,".gk-dropdown")){
			sixl=!Boolean(parseInt(e.target.getAttribute("opened")));
			e.target.setAttribute("opened",booltoint(sixl))
			e.target.nextElementSibling.setAttribute("opened",booltoint(sixl))
		}
		/*--Navegacion--*/
		if(is(e,'#nextdir')){
			tabHistoryNext(ui.currenttab);
		};
		if(is(e,'#prevdir')){
			tabHistoryPrev(ui.currenttab);
		};
		
	});
	var x;
	ui.navinput_b.addEventListener('mousedown',function(e){
		app.scrollnb = true;
		x = e.clientX+ui.navinput_b.scrollLeft;
	})
	window.addEventListener('mouseup',function(e){
		app.scrollnb = false;
	})
	ui.navinput_b.addEventListener('mousemove',function(e){
		if (x && app.scrollnb) {
			xscroll=x-e.clientX;
			if(xscroll > 1 || xscroll < -1){
				app.scrollnbsg = true;
			}
			ui.navinput_b.scrollLeft=xscroll;
		}
	})
	window.addEventListener('mouseover',function(e){
		if( ((isclosest(e,'.f-icon') || isclosest(e,'.f-name')) && app.view == 'mosaic') || (isclosest(e,'.file-e') && app.view == 'list')){
			fe=closest(e,'.file-e');
			xname=fe.querySelector('.f-name').innerHTML;
			if(fe.getAttribute('ltype') == 'symboliclink'){
				getID("nbox").innerHTML='link to '+xname;
			}else{
				getID("nbox").innerHTML=xname;
			}
			show(getID("nbox"));
		}else if(!isclosest(e,'#nbox')){
			hide(getID("nbox"));
		}
	})
	document.addEventListener('scroll', function(e) {
		if(is(e,'.tabcont')){
			thumbnailsShow(e);
		}
	}, true);
	
	window.addEventListener('keydown', function(e){
		if(e.keyIdentifier === 'F5'){window.location.reload();}
		if(e.keyIdentifier === 'F12'){app.main_w.showDevTools();}
		if(e.keyCode == 16){keyh.shift=true;}
		if(e.keyCode == 17){keyh.ctrl=true;}
		if(e.keyCode == 18){keyh.altk=true;}
		if(e.keyCode == 72){if(keyh.ctrl){
			app.showhidden=(app.showhidden) ? false:true;
			localStorage["showhidden"]=app.showhidden;
			for (var i = 0; i < ui.tabs.children.length; i++) {
				reloadDir(ui.tabs.children[i].getAttribute('tabid'));
			};
		}}
		if(e.keyCode == 13){
			if(e.srcElement.id == "navinput"){
				val=e.srcElement.value;
				val=(val.substr(val.length-1,1) != "/") ? val+"/":val;
				if(ui.tabs.childElementCount > 0){
					goToDir(ui.currenttab,path.normalize(val));
				}else{
					addTab(path.normalize(val));
					goToDir(ui.currenttab,path.normalize(val));
				}
				ui.navinput_c.setAttribute('editmode','0');
				tabHistoryPush(ui.currenttab,val);
			}
		}
	});
	window.addEventListener('keyup', function(e){
		if(e.keyCode == 16){keyh.shift=false;}
		if(e.keyCode == 17){keyh.ctrl=false;}
		if(e.keyCode == 18){keyh.altk=false;}
	});
});
function thumbnailsShow(e){
		var target = e.target || e
		var scroll = target.scrollTop;
		tabcont=ui.files.querySelector('[tabid="'+ui.currenttab+'"]');
		files=tabcont.querySelectorAll('.file-e');
		for (var i = 0; i < files.length; i++) {
			var otop = files[i].offsetTop;
			var ohei = files[i].offsetHeight;
			var oheip = files[i].offsetParent.offsetHeight;
			var ficon = files[i].querySelector('.f-icon');
			if(ficon.getAttribute('thumbnailed') == '1'){
				if(otop+ohei > scroll &&  otop < scroll+oheip){
					ficon.style.backgroundImage="url('"+ficon.getAttribute('lsrc')+"')";
				}else{
					ficon.style.backgroundImage='';
				}
			}
		};
	};
/*--UI namespace--*/
ui.loadElements=function(){
	ui.navinput=getID('navinput');
	ui.navinput_b=getID('navinput-b');
	ui.navinput_c=getID('navinput-c');
	ui.tabs=getID('tabs');
	ui.files=getID('files');
	ui.prevdir=getID('prevdir');
	ui.nextdir=getID('nextdir');
	ui.bookmarks=getID("bookmarks");
}
//Cambia la direccion en la barra de direccion
ui.setPath=function(path_n){
	ui.navinput.value=path_n;
	ui.navinput_b.innerHTML="";
	path_s=path.split(path_n);
	if(path_n == ""){ui.navinput_b.innerHTML="";}else{
		for (var i = 0; i < path_s.length; i++) {
			ui.navinput_b.innerHTML+="<div class='nav-dir bz' path='"+arr2strN(path_s,i+1)+"'>"+path_s[i]+"</div>";
		};
	}
	if(path_n != "/"){
		nametab=path.basename(path_n);
	}else{
		nametab="Sistema de archivos";
	}
	ui.tabs.querySelector('[tabid="'+ui.currenttab+'"]').querySelector('.tabtext').innerHTML=nametab;
}
function goToDir(tabid,dir){
	ui.setPath(dir);
	if(fs.existsSync(dir)){
		tab=ui.tabs.querySelector('[tabid="'+tabid+'"]');
		tab.setAttribute('dir',dir);
		showFilesInView(tabid,fsort(fsw.ls(dir,'d'),{showhidden:app.showhidden}));
	}
}
function reloadDir(tabid){
	tab=ui.tabs.querySelector('[tabid="'+tabid+'"]');
	goToDir(tabid,tab.getAttribute('dir'));
}
function showFilesInView(tabid,files){
	//tabtar.innerHTML+="<div class='file-e nosel' xtype='dir'><div class='f-icon'></div><div class='f-name'>"+ohfolders[i][0]+"</div></div>";
	tabcont=ui.files.querySelector('[tabid="'+tabid+'"]');
	tabcont.innerHTML="";
	for(folder in files.directory){
		emblems="";
		if(files.directory[folder].type == 'symboliclink'){
			emblems+="<div emblem='symboliclink'></div>";
		}
		tabcont.innerHTML+="<div class='file-e nosel' xtype='dir' ltype='"+files.directory[folder].type+"' sel='0' file='"+files.directory[folder].file+"'><div class='f-icon' xtype='dir'><div class='emblems'>"+emblems+"</div></div><div class='f-name'>"+files.directory[folder].file+"</div></div>";
	}
	for(folder in files.directory_h){
		emblems="";
		if(files.directory_h[folder].type == 'symboliclink'){
			emblems+="<div emblem='symboliclink'></div>";
		}
		tabcont.innerHTML+="<div class='file-e nosel' xtype='dir' ltype='"+files.directory_h[folder].type+"' sel='0' file='"+files.directory_h[folder].file+"'><div class='f-icon' xtype='dir' hidden_f='1'><div class='emblems'>"+emblems+"</div></div><div class='f-name'>"+files.directory_h[folder].file+"</div></div>";
	}
	for(file in files.files){
		emblems="";
		if(files.files[file].type == 'symboliclink'){
			emblems+="<div emblem='symboliclink'></div>";
		}
		tabcont.innerHTML+="<div class='file-e nosel' xtype='file' ltype='"+files.files[file].type+"' ext='"+path.extname(files.files[file].file)+"' file='"+str2hex(files.files[file].file)+"'><div class='f-icon' xtype='file' ext='"+path.extname(files.files[file].file)+"'><div class='emblems'>"+emblems+"</div></div><div class='f-name'>"+files.files[file].file+"</div></div>";
	}
	for(file in files.files_h){
		emblems="";
		if(files.files_h[file].type == 'symboliclink'){
			emblems+="<div emblem='symboliclink'></div>";
		}
		tabcont.innerHTML+="<div class='file-e nosel' xtype='file' ltype='"+files.files_h[file].type+"' ext='"+path.extname(files.files_h[file].file)+"' file='"+str2hex(files.files_h[file].file)+"'><div class='f-icon' xtype='file' hidden_f='1' ext='"+path.extname(files.files_h[file].file)+"'><div class='emblems'>"+emblems+"</div></div><div class='f-name'>"+files.files_h[file].file+"</div></div>";
	}
	autoHeight(tabcont);
	updateIcons(tabcont);
	gen_thumbnails(tabcont);
	thumbnailsShow(tabcont);
	tabcont.scrollTop = 0;
}
function fsort(fi,o){
	o=(typeof o != 'undefined')? o:{};
	o.showhidden=(typeof o.showhidden != 'undefined')? o.showhidden:false;
	folders=[];
	foldersh=[];
	files=[];
	filesh=[];
	//Separamos los archivos y los directorios
	for (var i = 0; i < fi.length; i++) {
		if(fi[i].file.substr(0,1) == '.'){
			if(o.showhidden){
				if(fi[i].type == 'directory'){
					foldersh.push(fi[i]);
				}else{
					filesh.push(fi[i]);
				}
			}
		}else{
			if(fi[i].type == 'directory'){
				folders.push(fi[i]);
			}else{
				files.push(fi[i]);
			}
		}
	};
	folders.sort(sortAlphaNum);
	foldersh.sort(sortAlphaNum);
	files.sort(sortAlphaNum);
	filesh.sort(sortAlphaNum);
	return {directory:folders,files:files,directory_h:foldersh,files_h:filesh};
}
var reA = /[^a-zA-Z]/g;
var reN = /[^0-9]/g;
function sortAlphaNum(a,b) {
	a=a.file.toLowerCase();
	b=b.file.toLowerCase();
	var AInt = parseInt(a, 10);
	var BInt = parseInt(b, 10);

	if(isNaN(AInt) && isNaN(BInt)){
		var aA = a.replace(reA, "");
		var bA = b.replace(reA, "");
		if(aA === bA) {
			var aN = parseInt(a.replace(reN, ""), 10);
			var bN = parseInt(b.replace(reN, ""), 10);
			return aN === bN ? 0 : aN > bN ? 1 : -1;
		} else {
			return aA > bA ? 1 : -1;
		}
	}else if(isNaN(AInt)){
		return 1;
	}else if(isNaN(BInt)){
		return -1;
	}else{
		return AInt > BInt ? 1 : -1;
	}
}


//Obtiene x cantidad de elementos de un array y los pasa a string
function arr2strN(arr,n){
	str="";
	for (var i = 0; i < ((n <= arr.length)? n:arr.length); i++) {
		str+=arr[i]+"/";
	};
	return path.normalize(str);
}

/*--Tab manager--*/
function tabHistoryCreate(tabid,dir){
	tabs.history[tabid]={};
	tabs.history[tabid].history=[];
	tabs.history[tabid].history.push(dir);
	tabs.history[tabid].index=0;
	tabHistoryUpdt(tabid);
}
function tabHistoryRemove(tabid){
	delete tabs.history[tabid];
}
function tabHistoryNext(tabid){
	index=tabs.history[tabid].index;
	length=tabs.history[tabid].history.length;
	if(index < length-1){
		tabs.history[tabid].index+=1;
		index+=1;
		goToDir(tabid,tabs.history[tabid].history[index]);
	}
	tabHistoryUpdt(tabid);
};
function tabHistoryPrev(tabid){
	index=tabs.history[tabid].index;
	length=tabs.history[tabid].history.length;
	if(index > 0){
		tabs.history[tabid].index-=1;
		index-=1;
		goToDir(tabid,tabs.history[tabid].history[index]);
	}
	tabHistoryUpdt(tabid);
};
function tabHistoryPush(tabid,dir){
	index=tabs.history[tabid].index;
	length=tabs.history[tabid].history.length;
	tabs.history[tabid].history.splice(index+1,((length-1)-index));
	tabs.history[tabid].history.push(dir);
	tabs.history[tabid].index=tabs.history[tabid].history.length-1;
	tabHistoryUpdt(tabid)
};
function tabHistoryUpdt(tabid){
	if(tabid > 0){
		index=tabs.history[tabid].index;
		length=tabs.history[tabid].history.length;
		if(length > 1){
			if(index > 0){
				ui.prevdir.setAttribute('unabled','0');
			}else{
				ui.prevdir.setAttribute('unabled','1');
			}
			if(index < length-1){
				ui.nextdir.setAttribute('unabled','0');
			}else{
				ui.nextdir.setAttribute('unabled','1');
			}
		}else{
			ui.prevdir.setAttribute('unabled','1');
			ui.nextdir.setAttribute('unabled','1');
		}
	}else{
		ui.prevdir.setAttribute('unabled','1');
		ui.nextdir.setAttribute('unabled','1');
	}
};
function addTab(dir){
	tabs.tabnumb+=1;
	tabs.tabcid+=1;
	tabelem="<div class='tab' sel='1' tabid='"+tabs.tabcid+"' dir='"+dir+"'><div class='l tabtext'>"+path.basename(dir)+"</div><div class='closetab bz'>&#xf00d;</div></div>"
	ui.tabs.innerHTML+=tabelem;
	ui.files.innerHTML+="<div class='tabcont bz' tabid='"+tabs.tabcid+"'></div>";
	ui.currenttab=tabs.tabcid;
	goToDir(tabs.tabcid,app.userdir);
	showTab(tabs.tabcid);
	tabHistoryCreate(tabs.tabcid,dir);
}
function removeTab(tabid){
	tabHistoryRemove(tabid);
	tabs.tabnumb-=1;
	tabel=ui.tabs.querySelector('[tabid="'+tabid+'"]');
	if(ui.tabs.childElementCount > 1){
		if(tabel.previousElementSibling != null){
			tabidx=tabel.previousElementSibling.getAttribute('tabid');
			showTab(tabidx);
			tabHistoryUpdt(tabidx);
		}else if(tabel.nextElementSibling != null){
			tabidx=tabel.nextElementSibling.getAttribute('tabid');
			showTab(tabidx);
			tabHistoryUpdt(tabidx);
		}
	}else{
		ui.setPath('');
		tabHistoryUpdt(0);
	}
	tabel.remove();
	ui.files.querySelector('[tabid="'+tabid+'"]').remove();
}
function showTab(tabid){
	updateIcons();
	ui.currenttab=tabid;
	hideTabs();
	tab=ui.tabs.querySelector('[tabid="'+tabid+'"]');
	ui.setPath(tab.getAttribute('dir'));
	tab.setAttribute('sel','1');
	ui.files.querySelector('[tabid="'+tabid+'"]').setAttribute('sel','1');
}
function hideTabs(){
	for (var i = 0; i < ui.tabs.children.length; i++) {
		ui.tabs.children[i].setAttribute('sel','0');
	};
	chil=ui.files.querySelectorAll('.tabcont');
	for (var i = 0; i < chil.length; i++) {
		chil[i].setAttribute('sel','0');
	};
}
function autoHeight(w){
	maxh=0;
	files=w.getElementsByClassName('file-e');
	for (var i = 0; i < files.length; i++) {
		files[i].style.height="auto";
	};
	for (var i = 0; i < files.length; i++) {
		cheight=parseInt(getComputedStyle(files[i], null).height);
		maxh=(cheight > maxh)? cheight:maxh;
	};
	maxh = (maxh > 134) ? 134:maxh;
	for (var i = 0; i < files.length; i++) {
		files[i].style.height=maxh;
	};
}
//Cambiar de vista
function setView(view){
	viewbnts=getClass('view-btn');
	for (var i = 0; i < viewbnts.length; i++) {
		if(viewbnts[i].getAttribute('view') == view){
			viewbnts[i].setAttribute('sel','1');
		}else{
			viewbnts[i].setAttribute('sel','0');
		}
	};
	ui.files.setAttribute('view',view);
	localStorage["view"]=view;
	app.view=view;
	tabcont=ui.files.querySelector('[tabid="'+ui.currenttab+'"]');
	app.iconsize=(app.view == 'list')? 16:64;
	autoHeight(tabcont);
	updateIcons();
}
//Bookmarks
function loadBookmarks(){
	exist=fs.existsSync(app.userdir+"/.gtk-bookmarks");
	gtk3exist=fs.existsSync(app.userdir+"/.config/gtk-3.0/bookmarks");
	if(exist){
		app.bookmarksf=fs.readFileSync(app.userdir+"/.gtk-bookmarks", {encoding: "utf8"});
		if(gtk3exist){
			app.bookmarksf+="\n"+fs.readFileSync(app.userdir+"/.config/gtk-3.0/bookmarks", {encoding: "utf8"});
		}
		app.bookmarks=app.bookmarksf.split("\n");
		app.bookmarks.reverse();
		app.bookmarks.push("file://"+app.userdir+" Carpeta personal");
		app.bookmarks.reverse();
		for (var i = app.bookmarks.length - 1; i >= 0; i--) {
			app.bookmarks[i]=app.bookmarks[i].substr(7,app.bookmarks[i].length-7);
			if(app.bookmarks[i] == ""){app.bookmarks.splice(i,1);}
		};
	}else{
		fs.createWriteStream(app.userdir+"/.gtk-bookmarks", { flags: 'w',encoding: null,mode: 0666 ,autoClose: true})
	}
}
function showBookmarks(){
	if(app.lbookmarks==app.bookmarksf){return false;}
	fgx="";
	for (var i = 0; i < app.bookmarks.length; i++) {
		cbookmark=app.bookmarks[i].split(" ")
		if(cbookmark.length > 1){
			texta=app.bookmarks[i].substr(app.bookmarks[i].indexOf(" "),app.bookmarks[i].length);
			namedir=decodeURIComponent(texta);
			cbookmark[0]=(cbookmark[0].substr(cbookmark[0].length-1,1) != "/") ? cbookmark[0]+"/":cbookmark[0];
		}else{
			cbookmark[0]=(cbookmark[0].substr(cbookmark[0].length-1,1) != "/") ? cbookmark[0]+"/":cbookmark[0];
			namedir=cbookmark[0].split("/");
			namedir=decodeURIComponent(namedir[namedir.length-2]);
		}
		fgx+='<div class="gk-dropdown-item bz nosel" sel="0" tdir="'+decodeURIComponent(cbookmark[0])+'"><div class="l gk-sidebar-icon"></div>'+namedir+'</div>';
	};
	if(getID("bookmarks").innerHTML != fgx){
		getID("bookmarks").innerHTML=fgx;
	}
	app.lbookmarks=app.bookmarksf;
}
function bookmarksCheck(){
	if(ui.tabs.childElementCount > 0){
		curdir=ui.tabs.querySelector('[tabid="'+ui.currenttab+'"]').getAttribute('dir');
	}else{
		curdir="";
	}
	bookmr=ui.bookmarks.querySelectorAll('.gk-dropdown-item');
	for (var i = 0; i < bookmr.length; i++) {
		if(bookmr[i].getAttribute('tdir') == curdir){
			bookmr[i].setAttribute('sel','1')
		}else{
			bookmr[i].setAttribute('sel','0')
		}
	};
}
function updateIcons(){
	tabcont=(typeof tabcont != 'undefined')? tabcont:null;
	icons.get('folder',app.iconsize,function(icon){
		setFoldersIcon(icon);
	});
	icons.get('folder',16,function(icon){
		bookmr=ui.bookmarks.querySelectorAll('.gk-sidebar-icon');
		for (var i = 0; i < bookmr.length; i++) {
			bookmr[i].style.backgroundImage="url('"+icon+"')";
			bookmr[i].style.backgroundSize="16px";
		};
	});
	icons.get('emblem-symbolic-link',((app.view == 'list')? 8:16),function(icon){
		emblm=ui.files.querySelectorAll('.emblems div[emblem="symboliclink"]');
		for (var i = 0; i < emblm.length; i++) {
			emblm[i].style.backgroundImage="url('"+icon+"')";
			emblm[i].style.backgroundSize="auto";
		};
	});
	setFileIcons(tabcont);
}
function setFoldersIcon(icon){
	items=ui.files.querySelectorAll('.f-icon[xtype="dir"]');
	for (var i = 0; i < items.length; i++) {
		items[i].style.backgroundImage="url('"+icon+"')";
		items[i].style.backgroundSize=app.iconsize+"px";
	};
}
function setFileIcons(){
	items=ui.files.querySelectorAll('.f-icon[xtype="file"]');
	tt=false;
	iconslisted=[];
	for (var i = 0; i < items.length; i++) {
		if(i == items.length-1){tt=true;}
		iconname=getTypeByExt(items[i].getAttribute('ext'));
		if(iconslisted.indexOf(iconname) < 0){
			iconslisted.push(iconname)
			icons.get(iconname,app.iconsize,function(icon){
				for (var i = 0; i < this.items.length; i++) {
					if(getTypeByExt(this.items[i].getAttribute('ext')) == this.iconname){
						if(this.items[i].getAttribute('thumbnailed') != '1'){
							this.items[i].style.backgroundImage="url('"+icon+"')";
							this.items[i].style.backgroundSize=app.iconsize+"px";
						}
					}
				};
			}.bind({items:items,iconname:iconname}) );
		}
	};
}
function getTypeByExt(w){
	if(w == null){ag="";}else{ag=w.substr(1,w.length);}
	switch(ag.toLowerCase()){
		case "png":
		case "jpeg":
		case "jpg":
		case "gif":
		case "bmp":
		case "ico":
		case "xcf":
			return "image-x-generic";
		break;
		case "psd":
			return "image-vnd.adobe.photoshop";
		break;
		case "mp3":
		case "aac":
		case "ac3":
		case "m3u":
		case "mp3":
		case "m4a":
		case "ogg":
		case "wma":
		case "mid":
		case "midi":
		case "wav":
		case "flac":
			return "audio-x-generic";
		break;
		case "mp4":
		case "wmv":
		case "3gp":
		case "3gpp":
		case "mkv":
		case "mov":
		case "flv":
		case "mpg":
		case "mpeg":
			return "video-x-generic";
		break;
		case "flv":
			return "application-x-flash-video"
		break;
		case "txt":
			return "text-plain";
		break;
		case "sh":
		case "php":
		case "js":
			return "shellscript";
		break;
		case "py":
			return "text-x-python";
		break;
		case "zip":
		case "jar":
		case "rar":
		case "bz":
		case "xz":
		case "7z":
		case "lzma":
		case "bz2":
		case "cbz":
		case "ar":
		case "gz":
			return "package-x-generic";
		break;
		case "html":
		case "htm":
		case "xhtml":
		case "xhtm":
			return "text-html";
		break;
		case "iso":
		case "cso":
		case "img":
		case "mds":
			return "application-x-cd-image";
		break;
		case "exe":
			return "application-x-executable";
		break;
		default:
			return "text-x-preview"
		break;
	}
}
function genFolders(base,dir){
	fld=dir.split("/");
	basedir=base+"/";
	for (var i = 0; i < fld.length-1; i++){
		basedir+=fld[i]+"/";
		if(!fs.existsSync(basedir)){fs.mkdirSync(basedir, 0766);}
	};
}
function gen_thumbnails(domx){
	console.log('gen_thumbnails')
	if(app.view == "mosaic"){
		tabid=domx.getAttribute('tabid');
		dir=ui.tabs.querySelector('[tabid="'+tabid+'"]').getAttribute('dir');
		thumbdir=app.userdir+'.local/share/nomowifiles/thumbnails';
		if(!fs.existsSync(thumbdir+"/")){
			console.log('noexiste')
			genFolders(app.userdir,'.local/share/nomowifiles/thumbnails');
			//fs.mkdirSync(thumbdir+"/", 0766);
		}
		//recreate folder tree
		genFolders(thumbdir,dir);
		w=domx;
		files=w.getElementsByClassName('file-e');
		for (var i = 0; i < files.length; i++) {
			if(files[i].getAttribute('xtype') == "file"){
				filename=files[i].getElementsByClassName('f-name')[0].innerHTML;
				ext=files[i].getAttribute('ext')
				ext=ext.substr(1,ext.length-1);
				if(thumbnailsType(ext) == "image"){
					try{
						imgsize=sizeOfImage(dir+filename);
					}catch(e){
						imgsize={
							width:1,
							height:1
						}
					}
					if(imgsize.height > 80){
						setTimeout(function(){
							var thumbnail = new Thumbnail(this.dir, this.thumbdir+this.dir);
							thumbnail.ensureThumbnail(this.filename, null, 100, function (err, filename) {
								if(typeof filename != "undefined"){
									elemtoi=this.felem.getElementsByClassName('f-icon')[0]
									elemtoi.setAttribute('thumbnailed','1')
									elemtoi.setAttribute('lsrc',thumbdir+"/"+this.basedir+filename)
									//elemtoi.style.backgroundImage="url('"+thumbdir+"/"+this.basedir+filename+"')";
									elemtoi.style.width="120px";
									thumbnailPShow(this.felem,this.domx.scrollTop);
								}
							}.bind({felem:this.felem,basedir:this.basedir,domx:this.domx}));
						}.bind({felem:files[i],basedir:dir,dir:dir,thumbdir:thumbdir,filename:filename,domx:domx}),30*i)
					}else if(imgsize.width > 120){
						elemtoi=files[i].getElementsByClassName('f-icon')[0]
						elemtoi.setAttribute('thumbnailed','1')
						elemtoi.setAttribute('lsrc',dir+filename)
						//elemtoi.style.backgroundImage="url('"+dir+filename+"')";
						elemtoi.style.backgroundSize="contain";
						elemtoi.style.width="120px";
						thumbnailPShow(files[i],domx.scrollTop);
					}else{
						elemtoi=files[i].getElementsByClassName('f-icon')[0]
						elemtoi.setAttribute('thumbnailed','1')
						elemtoi.setAttribute('lsrc',dir+filename)
						//elemtoi.style.backgroundImage="url('"+dir+filename+"')";
						elemtoi.style.backgroundSize="auto";
						elemtoi.style.width="120px";
						thumbnailPShow(files[i],domx.scrollTop);
					}
				}else if(thumbnailsType(ext) == "directimage"){
					elemtoi=files[i].getElementsByClassName('f-icon')[0]
					elemtoi.setAttribute('thumbnailed','1')
					elemtoi.setAttribute('lsrc',dir+filename)
					//elemtoi.style.backgroundImage="url('"+dir+filename+"')";
					elemtoi.style.width="120px";
					thumbnailPShow(files[i],domx.scrollTop);
				}
			}
		};
	}else{
		w=domx;
		files=w.getElementsByClassName('file-e');
		for (var i = 0; i < files.length; i++) {
			files[i].style.height="auto";
			//elemtoi=files[i].getElementsByClassName('f-icon')[0];
			//elemtoi.setAttribute('thumbnailed','1')
			//elemtoi.style.backgroundImage="";
		}
	}
}
function thumbnailPShow(el,scroll){
	try{
		var otop = el.offsetTop;
		var ohei = el.offsetHeight;
		var oheip = el.offsetParent.offsetHeight;
		var ficon = el.querySelector('.f-icon');
		if(ficon.getAttribute('thumbnailed') == '1'){
			if(otop+ohei > scroll &&  otop < scroll+oheip){
				ficon.style.backgroundImage="url('"+ficon.getAttribute('lsrc')+"')";
			}else{
				ficon.style.backgroundImage='';
			}
		}
	}catch(e){
		return false;
	}
}
function thumbnailsType(w){
	switch(w){
		case "png":
		case "jpeg":
		case "jpg":
			return "image";
		break;
		case "gif":
		case "bmp":
		case "ico":
				return "directimage";
		break;
		default:
			return ""
		break;
	}
}
//Vuelca el contenido de una variable a texto
function dtx(dt,verbose){
	verbose=(!verbose)? false:true;
	fgt="";
	if(typeof dt == 'object'){
		if(typeof dt.push != "undefined"){
			//Es un array
			for (var i = 0; i < dt.length; i++) {
				if(!verbose){
					fgt+=((typeof dt[i] == 'object')? dtx(dt[i],verbose):dt[i])+"<br>";
				}else{
					fgt+="Index: "+i+" ->"+((typeof dt[i] == 'object')? dtx(dt[i],verbose):dt[i])+"<br>";
				}
			};
		}else{
			//Es un objeto
			for(key in dt){
				if(!verbose){
					fgt+=((typeof dt[key] == 'object')? dtx(dt[key],verbose):dt[key])+"<br>";
				}else{
					fgt+="Key:"+key+" Value:"+((typeof dt[key] == 'object')? dtx(dt[key],verbose):dt[key])+"<br>";
				}
			}
		}
	}else{
		fgt=dt;
	}
	return fgt;
}