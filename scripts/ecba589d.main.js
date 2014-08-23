window.SysViewModel=function(){"use strict";function a(){var a=this,b={Waiting:"default",Ready:"success",Compiling:"primary",Cancelled:"default",Success:"success",Warnings:"warning",Failed:"danger"},c={Stopped:"danger",Booting:"warning",Running:"success",Paused:"default"};a.challengeDoc=ko.observable("<p>Welcome</p>"),a.gccErrorCount=ko.observable(0),a.gccWarningCount=ko.observable(0),a.gccOptions=ko.observable("-lm -Wall -fmax-errors=10 -Wextra"),a.programArgs=ko.observable(""),a.lastGccOutput=ko.observable(""),a.compileStatus=ko.observable("Waiting"),a.compileStatusClass=ko.pureComputed(function(){return"label label-"+b[a.compileStatus()]}),a.compileBtnEnable=ko.pureComputed(function(){return!("Waiting"===a.compileStatus()||"Compiling"===a.compileStatus())}),a.errorWarningLabel=ko.pureComputed(function(){var b=a.gccErrorCount(),c=a.gccWarningCount(),d="";return d+=b?b+" error"+(b>1?"s ":" "):"",d+=c?c+" warning"+(c>1?"s":""):"",d&&(d+="..."),d}),a.vmState=ko.observable("Stopped"),a.vmStateClass=ko.pureComputed(function(){return"label label-"+c[a.vmState()]}),a.vmMips=ko.observable(0),a.showLastGccOutput=function(){var b=a.lastGccOutput();b&&window.alert(b)}}return a}(),window.Jor1kGUI=function(){"use strict";function a(a){this.ReceiveChar=function(b){a.lastMouseDownTarget!==a.fbcanvas&&a.sendToWorker("tty0",b)}}function b(b,c,d,e,f){this.urls=e,this.worker=new Worker("jor1k/js/worker/worker.js"),this.worker.onmessage=this.onMessage.bind(this),this.worker.onerror=function(a){console.log("Error at "+a.filename+":"+a.lineno+": "+a.message)},this.sendToWorker=function(a,b){this.worker.postMessage({command:a,data:b})},this.reset=function(){this.stop=!1,this.userpaused=!1,this.executepending=!1,this.sendToWorker("Reset"),this.sendToWorker("LoadAndStart",this.urls),this.term.PauseBlink(!1)},this.pause=function(a){a=!!a,a!==this.userpaused&&(this.userpaused=a,!this.userpaused&&this.executepending&&(this.executepending=!1,this.sendToWorker("execute",0)),this.term.PauseBlink(a))},this.terminalcanvas=document.getElementById(b),this.term=new Terminal(24,80,b),this.terminput=new TerminalInput(new a(this)),this.ignoreKeys=function(){return this.lastMouseDownTarget!==this.terminalcanvas};var g=function(a){this.lastMouseDownTarget=a.target}.bind(this);document.addEventListener?document.addEventListener("mousedown",g,!1):window.onmousedown=g,document.onkeypress=function(a){return this.ignoreKeys()?!0:(this.sendToWorker("keypress",{keyCode:a.keyCode,charCode:a.charCode}),this.terminput.OnKeyPress(a))}.bind(this),document.onkeydown=function(a){return this.ignoreKeys()?!0:(this.sendToWorker("keydown",{keyCode:a.keyCode,charCode:a.charCode}),this.terminput.OnKeyDown(a))}.bind(this),document.onkeyup=function(a){return this.ignoreKeys()?!0:(this.sendToWorker("keyup",{keyCode:a.keyCode,charCode:a.charCode}),this.terminput.OnKeyUp(a))}.bind(this),this.ethernet=new Ethernet(f),this.ethernet.onmessage=function(a){this.sendToWorker("ethmac",a.data)}.bind(this),this.reset(),window.setInterval(function(){this.sendToWorker("GetIPS",0)}.bind(this),1e3)}return b.prototype.onMessage=function(a){if(!this.stop)switch(a.data.command){case"execute":this.userpaused?this.executepending=!0:(this.executepending=!1,this.sendToWorker("execute",0));break;case"ethmac":this.ethernet.SendFrame(a.data.data);break;case"tty0":this.term.PutChar(a.data.data);break;case"Stop":console.log("Received stop signal"),this.stop=!0;break;case"GetIPS":sysViewModel.vmMips(this.userpaused?0:Math.floor(a.data.data/1e5)/10);break;case"Debug":console.log(a.data.data)}},b}(),window.ExpectTTY=function(){"use strict";function a(a,b,c){this.output="",this.callback=c,this.expect=b,this.sys=a,this.found=!1,this.expectPutCharListener=function(a,b){this.output=this.output.substr(this.output.length===this.expect.length?1:0)+b.detail.character,this.output===this.expect&&(this._cleanup(),this.callback(!0))}.bind(this),this.sys.addListener("putchar",this.expectPutCharListener)}return a.prototype._cleanup=function(){this.sys.removeListener("putchar",this.expectPutCharListener)},a.prototype.cancel=function(){this._cleanup(),this.callback(!1)},a}(),window.LiveEdit=function(){"use strict";function a(a,b){this.runtime=b,this.ace=ace.edit(a),this.ace.setTheme("ace/theme/monokai"),this.ace.getSession().setMode("ace/mode/c_cpp"),this.viewModel=sysViewModel;var c=function(){var a=this.runtime.ready();this.viewModel.vmState(a?"Running":"Booting"),this.viewModel.compileStatus(a?"Ready":"Waiting")}.bind(this);c(),this.runtime.addListener("ready",function(){c()}.bind(this))}return a.prototype.escapeHtml=function(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")},a.prototype.processGccCompletion=function(a){return this.viewModel.gccErrorCount(0),this.viewModel.gccWarningCount(0),a?(this.runtime.sendKeys("clear\n"),this.ace.getSession().setAnnotations(a.annotations),this.viewModel.lastGccOutput(a.gccOutput),this.viewModel.gccErrorCount(a.stats.error),this.viewModel.gccWarningCount(a.stats.warning),void(0===a.exitCode?(this.viewModel.compileStatus(a.stats.warning>0?"Warning":"Success"),this.runtime.startProgram("program",this.viewModel.programArgs())):this.viewModel.compileStatus("Failed"))):void this.viewModel.compileStatus("Cancelled")},a.prototype.getCodeText=function(){return this.ace.getSession().getValue()},a.prototype.runCode=function(a,b){if(!(0===a.length||a.indexOf("")>=0||a.indexOf("")>=0)){var c=this.processGccCompletion.bind(this);this.viewModel.compileStatus("Compiling"),this.runtime.startGccCompile(a,b,c)}},a.prototype.setTheme=function(a){this.ace.setTheme("ace/theme/"+a)},a}(),window.SysRuntime=function(){"use strict";function a(){this.bootFinished=!1,this.listeners={},this.ttyState=this.BOOT,this.ttyOutput="",this.captureOutput=!1,this.compileTicket=0,this.gccOutputCaptureRe=/###GCC_COMPILE###\s*([\S\s]*?)\s*###GCC_COMPILE_FINISHED###/,this.gccExitCodeCaptureRe=/GCC_EXIT_CODE: (\d+)/,this.putCharListener=function(a){this.captureOutput&&(this.ttyOutput+=a.detail.character),this.notifyListeners("putchar",a)}.bind(this);var a=function(a){this.bootFinished=a,a&&this.notifyListeners("ready",!0)}.bind(this),b=function(b){b&&this.sendKeys("\nstty -clocal crtscts -ixoff\ngcc hello.c;echo boot2ready-$?\n","boot2ready-0",a)}.bind(this);return document.addEventListener("jor1k_terminal_put_char",this.putCharListener,!1),this.jor1kgui=new Jor1kGUI("tty","fb","stats",["../../bin/vmlinux.bin.bz2","../../../jor1k_hd_images/hdgcc-mod.bz2"],""),this.sendKeys("","root login on 'console'",b),this}a.prototype.ready=function(){return this.bootFinished},a.prototype.startGccCompile=function(a,b,c){if(!this.bootFinished)return 0;this.expecting&&this.expecting.cancel(),this.ttyOutput="",this.captureOutput=!0,++this.compileTicket;var d=function(a){var b=null;if(this.expecting=void 0,a){this.captureOutput=!1;var d=this.gccOutputCaptureRe.exec(this.ttyOutput),e=d[1],f=parseInt(this.gccExitCodeCaptureRe.exec(e)[1]);this.ttyOutput="";var g={error:0,warning:0,info:0},h=this.getErrorAnnotations(e);h.forEach(function(a){g[a.type]+=1}),b={exitCode:f,stats:g,annotations:h,gccOutput:e}}c(b)}.bind(this);this.sendKeys("\ncd ~;rm program.c program 2>/dev/null\n"),this.sendTextFile("program.c",a);var e="echo \\#\\#\\#GCC_COMPILE\\#\\#\\#;clear;gcc "+b+" program.c -o program; echo GCC_EXIT_CODE: $?; echo \\#\\#\\#GCC_COMPILE_FINISHED\\#\\#\\#"+this.compileTicket+".;clear\n";return this.expecting=this.sendKeys(e,"GCC_COMPILE_FINISHED###"+this.compileTicket+".",d),this.compileTicket},a.prototype.getErrorAnnotations=function(a){var b,c,d,e,f,g,h,i,j=/(?:program\.c|gcc|collect2):\s*(.+)\s*:\s*(.+)\s*/,k=/(\d+):(\d+):\s*(.+)/,l=/\s*(.+)\s*:\s*(.+)\s*/,m=[];return a.split("\n").forEach(function(a){b=j.exec(a),b&&(c=k.exec(b[1]),c?(e=c[1]-1,f=c[2],d=l.exec(c[3]),d?(g=d[1],i=d[2]+": "+b[2]):(g=c[3],i=b[2])):(e=f=0,d=l.exec(b[1]),d?(g=d[1],i=d[2]+": "+b[2]):(g=b[1],i=b[2])),h=-1!==g.toLowerCase().indexOf("error")?"error":-1!==g.toLowerCase().indexOf("warning")?"warning":"info",m.push({row:e,column:f,type:h,text:i}))}),m},a.prototype.startProgram=function(a,b){a&&("/"!==a[0]&&"."!==a[0]&&(a="./"+a.replace(" ","\\ ")),b=b.replace("\\","\\\\").replace("\n","\\n"),this.sendKeys("\n"+a+" "+b+"\n"))},a.prototype.sendTextFile=function(a,b){this.sendKeys("\nstty raw\ndd ibs=1 of="+a+" count="+b.length+"\n"+b+"\nstty -raw\n")},a.prototype.addListener=function(a,b){var c=this.listeners[a];c?c.push(b):this.listeners[a]=[b]},a.prototype.removeListener=function(a,b){var c=this.listeners[a];this.listeners[a]=c.filter(function(a){return a!==b})},a.prototype.notifyListeners=function(a,b){var c=this.listeners[a];if(c){c=c.slice();for(var d=0;c&&d<c.length;d++)c[d](this,b)}},a.prototype.sendKeys=function(a,b,c,d){var e="tty0",f=null;this.jor1kgui.pause(!1),b&&(f=new ExpectTTY(this,b,c,d));for(var g=0;g<a.length;g++)this.jor1kgui.sendToWorker(e,a.charCodeAt(g)>>>0);return f};var b;return{getInstance:function(){return b||(b=new a,b.constructor=null),b}}}(),window.compileMain=function(){"use strict";var a,b=function(){var b=a.getCodeText(),c=sysViewModel.gccOptions();return a.runCode(b,c),!1},c=function(b){a.setTheme(b)},d=function(){a=new LiveEdit("code",SysRuntime.getInstance())};return{startEditor:d,compileButtonClicked:b,setEditorTheme:c}}(),$(document).ready(function(){"use strict";var a=function(){var a=$("#layout").layout({livePaneResizing:!0,north__paneSelector:"#navbar-container",center__paneSelector:"#doc-tty-container",east__paneSelector:"#code-container",south__paneSelector:"#footer-container",east__size:"50%",spacing_open:2,north__resizable:!1,north__size:35,north__spacing_open:0,north__showOverflowOnHover:!0,south__resizable:!0,south__size:60,south__spacing_open:0}),b=a.panes.center.layout({livePaneResizing:!0,spacing_open:2,north__paneSelector:"#doc-container",center__paneSelector:"#tty",south__paneSelector:"#compile-opts-container",north__size:"25%",south__resizable:!1,south__size:28,south__spacing_open:0}),c=a.panes.east.layout({livePaneResizing:!0,spacing_open:2,north__paneSelector:"#editor-tabs-bar",center__paneSelector:"#code",south__paneSelector:"#code-south-bar",north__resizable:!1,north__size:30,north__spacing_open:0,south__resizable:!1,south__size:28,south__spacing_open:0});return{mainLayout:a,ttyLayout:b,codeLayout:c}};a(),window.sysViewModel=new SysViewModel,ko.applyBindings(window.sysViewModel),compileMain.startEditor()});