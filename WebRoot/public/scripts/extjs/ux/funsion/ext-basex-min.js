if(!String.prototype.trim){String.prototype.trim=function(){var A=/^\s+|\s+$/g;return function(){return this.replace(A,"");};}();}if(Ext.util.Observable){Ext.apply(Ext.lib.Ajax,{events:{request:true,beforesend:true,response:true,exception:true,abort:true,timeout:true,readystatechange:true},onStatus:function(A,E,D,C){var B=Array.prototype.slice.call(arguments,1);A=[].concat(A||[]);Ext.each(A,function(F){F=parseInt(F,10);if(!isNaN(F)){var G="status:"+F;this.events[G]||(this.events[G]=true);this.on.apply(this,[G].concat(B));}},this);},unStatus:function(A,E,D,C){var B=Array.prototype.slice.call(arguments,1);A=[].concat(A||[]);Ext.each(A,function(F){F=parseInt(F,10);if(!isNaN(F)){var G="status:"+F;this.un.apply(this,[G].concat(B));}},this);},onReadyState:function(){this.fireEvent.apply(this,["readystatechange"].concat(Array.prototype.slice.call(arguments,0)));}},new Ext.util.Observable());}Ext.lib.Ajax.QueueManager=function(A){Ext.apply(this,A||{},{quantas:10});this.priorityQueues=[[],[],[],[],[],[],[],[],[],[]];this.queues={};};Ext.apply(Ext.lib.Ajax.QueueManager.prototype,{getQueue:function(A){return this.queues[A];},createQueue:function(A){if(!A){return null;}var B=new Ext.lib.Ajax.Queue(A);B.manager=this;this.queues[B.name]=B;var C=this.priorityQueues[B.priority];if(C.indexOf(B.name)==-1){C.push(B.name);}return B;},removeQueue:function(A){if(A&&(A=this.getQueue(A.name||A))){A.clear();this.priorityQueues[A.priority].remove(A);delete this.queues[A.name];}},start:function(){if(!this.started){this.started=true;this.dispatch();}},stop:function(){this.started=false;},dispatch:function(){var C=Ext.lib.Ajax,B=this,A=B.queues;disp=function(E){var D=A[E];while(D&&D.pending&&C.pendingRequests&&C.activeRequests<C.maxConcurrentRequests){D.requestNext();}return C.pendingRequests>0?(C.activeRequests<C.maxConcurrentRequests):false;};Ext.each(this.priorityQueues,function(D){if(C.pendingRequests<1){return false;}return Ext.each(D||[],disp,this)==undefined?true:false;},this);C.pendingRequests>0?this.dispatch.defer(this.quantas,this):this.stop();}});Ext.lib.Ajax.Queue=function(A){A=A?(A.name?A:{name:A}):{};Ext.apply(this,A,{name:"q-default",priority:5,FIFO:true,callback:null,scope:null});this.requests=[];this.pending=false;this.priority=this.priority>9?9:(this.priority<0?0:this.priority);};Ext.apply(Ext.lib.Ajax.Queue.prototype,{add:function(A){this.requests.push(A);this.pending=true;Ext.lib.Ajax.pendingRequests++;if(this.manager){this.manager.start();}},next:function(){req=this.requests[this.FIFO?"shift":"pop"]();this.pending=!!this.requests.length;return req;},clear:function(){this.requests.length=0;this.pending=false;},requestNext:function(){var B,A,C=Ext.lib.Ajax;if(B=this.next()){C.pendingRequests--;A=C.request.apply(C,B);if(this.requests.length==0&&this.callback){this.callback.call(this.scope||null,this);}return A;}else{return false;}}});Ext.apply(Ext.lib.Ajax,{queueManager:new Ext.lib.Ajax.QueueManager(),activeRequests:0,pendingRequests:0,maxConcurrentRequests:Ext.isGecko?4:2,forceActiveX:false,async:true,createXhrObject:function(F){var E={status:{isError:false},tId:F},B;try{if(Ext.isIE7&&!!this.forceActiveX){throw ("IE7forceActiveX");}E.conn=new XMLHttpRequest();}catch(A){for(var C=0;C<this.activeX.length;++C){try{E.conn=new ActiveXObject(this.activeX[C]);break;}catch(D){}}}finally{E.status.isError=typeof (E.conn)=="undefined";}return E;},encoder:encodeURIComponent,serializeForm:function(B){if(typeof B=="string"){B=(document.getElementById(B)||document.forms[B]);}var C,A,D,F,G="",I=false;for(var H=0;H<B.elements.length;H++){C=B.elements[H];F=B.elements[H].disabled;A=B.elements[H].name;D=B.elements[H].value;if(!F&&A){switch(C.type){case"select-one":case"select-multiple":for(var E=0;E<C.options.length;E++){if(C.options[E].selected){if(Ext.isIE){G+=this.encoder(A)+"="+this.encoder(C.options[E].attributes["value"].specified?C.options[E].value:C.options[E].text)+"&";}else{G+=this.encoder(A)+"="+this.encoder(C.options[E].hasAttribute("value")?C.options[E].value:C.options[E].text)+"&";}}}break;case"radio":case"checkbox":if(C.checked){G+=this.encoder(A)+"="+this.encoder(D)+"&";}break;case"file":case undefined:case"reset":case"button":break;case"submit":if(I==false){G+=this.encoder(A)+"="+this.encoder(D)+"&";I=true;}break;default:G+=this.encoder(A)+"="+this.encoder(D)+"&";break;}}}G=G.substr(0,G.length-1);return G;},getHttpStatus:function(A){var C={status:0,statusText:"",isError:false,isLocal:false,isOK:false,error:null};try{if(!A){throw ("noobj");}C.status=A.status;C.isLocal=!A.status&&location.protocol=="file:"||Ext.isSafari&&A.status===undefined;C.isOK=(C.isLocal||(C.status>199&&C.status<300));C.statusText=A.statusText||"";}catch(B){}return C;},handleTransactionResponse:function(C,D,A){D=D||{};var B=null;this.activeRequests--;if(!C.status.isError){C.status=this.getHttpStatus(C.conn);B=this.createResponseObject(C,D.argument,A);}if(C.status.isError){B=Ext.apply({},B||{},this.createExceptionObject(C.tId,D.argument,(A?A:false)));}B.options=C.options;B.fullStatus=C.status;if(!this.events||this.fireEvent("status:"+C.status.status,C.status.status,C,B,D,A)!==false){if(C.status.isOK&&!C.status.isError){if(!this.events||this.fireEvent("response",C,B,D,A)!==false){if(D.success){D.success.call(D.scope||null,B);}}}else{if(!this.events||this.fireEvent("exception",C,B,D,A)!==false){if(D.failure){D.failure.call(D.scope||null,B);}}}}if(C.options.async){this.releaseObject(C);B=null;}else{this.releaseObject(C);return B;}},createResponseObject:function(A,J,D){var G={responseXML:null,responseText:"",responseStream:null,getResponseHeader:{},getAllResponseHeaders:""};var O={},C="";if(D!==true){try{G.responseText=A.conn.responseText;G.responseStream=A.conn.responseStream||null;}catch(K){A.status.isError=true;A.status.error=K;}try{G.responseXML=A.conn.responseXML||null;}catch(L){}try{C=A.conn.getAllResponseHeaders()||"";}catch(L){}}if(A.status.isLocal){A.status.isOK=!A.status.isError&&((A.status.status=(!!G.responseText.length)?200:404)==200);if(A.status.isOK&&(!G.responseXML||G.responseXML.childNodes.length===0)){var I=null;try{if(typeof (DOMParser)=="undefined"){I=new ActiveXObject("Microsoft.XMLDOM");I.async="false";I.loadXML(G.responseText);}else{var M=null;try{M=new DOMParser();I=M.parseFromString(G.responseText,"application/xml");}catch(L){}finally{M=null;}}}catch(N){A.status.isError=true;A.status.error=N;}G.responseXML=I;}if(G.responseXML){var E=(G.responseXML.documentElement&&G.responseXML.documentElement.nodeName=="parsererror")||(G.responseXML.parseError||0)!==0||G.responseXML.childNodes.length===0;if(!E){C="Content-Type: "+(G.responseXML.contentType||"text/xml")+"\n"+C;}}}var H=C.split("\n");for(var F=0;F<H.length;F++){var B=H[F].indexOf(":");if(B!=-1){O[H[F].substring(0,B)]=H[F].substring(B+2);}}G.tId=A.tId;G.status=A.status.status;G.statusText=A.status.statusText;G.getResponseHeader=O;G.getAllResponseHeaders=C;G.fullStatus=A.status;if(typeof J!="undefined"){G.argument=J;}return G;},setDefaultPostHeader:function(A){this.defaultPostHeader=A;},setDefaultXhrHeader:function(A){this.useDefaultXhrHeader=A||false;},request:function(A,C,E,G,K){K=Ext.apply({async:this.async||false,headers:false,userId:null,password:null,xmlData:null,jsonData:null,queue:null},K||{});if(!this.events||this.fireEvent("request",A,C,E,G,K)!==false){if(K.queue&&!K.queued){var B=K.queue,D=B.name||B,J=this.queueManager;B=J.getQueue(D)||J.createQueue(B);K.queued=true;B.add([A,C,E,G,K]);return{tId:this.transactionId++,queued:true};}var I=K.headers;if(I){for(var H in I){if(I.hasOwnProperty(H)){this.initHeader(H,I[H],false);}}}var F=this.headers["Content-Type"]||null;delete this.headers["Content-Type"];if(K.xmlData){F||(F="text/xml");A="POST";G=K.xmlData;}else{if(K.jsonData){F||(F="application/json");A="POST";G=typeof K.jsonData=="object"?Ext.encode(K.jsonData):K.jsonData;}}if(G){F||(F=this.useDefaultHeader?this.defaultPostHeader:null);if(F){this.initHeader("Content-Type",F,false);}}return this.makeRequest(K.method||A,C,E,G,K);}return null;},makeRequest:function(G,D,F,A,B){var E=this.getConnectionObject();if(!E||E.status.isError){return Ext.apply(E,this.handleTransactionResponse(E,F));}else{this.activeRequests++;E.options=B;try{E.conn.open(G,D,B.async,B.userId,B.password);E.conn.onreadystatechange=this.onReadyState?this.onReadyState.createDelegate(this,[E],0):Ext.emptyFn;}catch(C){E.status.isError=true;E.status.error=C;return Ext.apply(E,this.handleTransactionResponse(E,F));}if(this.useDefaultXhrHeader){if(!this.defaultHeaders["X-Requested-With"]){this.initHeader("X-Requested-With",this.defaultXhrHeader,true);}}if(this.hasDefaultHeaders||this.hasHeaders){this.setHeader(E);}if(E.options.async){this.handleReadyState(E,F);}try{if(!this.events||this.fireEvent("beforesend",E,G,D,F,A,B)!==false){E.conn.send(A||null);}}catch(C){E.status.isError=true;E.status.error=C;return Ext.apply(E,this.handleTransactionResponse(E,F));}return B.async?E:Ext.apply(E,this.handleTransactionResponse(E,F));}},abort:function(B,C,A){if(this.isCallInProgress(B)){B.conn.abort();window.clearInterval(this.poll[B.tId]);delete this.poll[B.tId];if(A){delete this.timeout[B.tId];}if(this.events){this.fireEvent(A?"timeout":"abort",B,C);}this.handleTransactionResponse(B,C,true);return true;}else{return false;}},clearAuthenticationCache:function(A){A||(A=".force_logout");try{if(Ext.isIE){document.execCommand("ClearAuthenticationCache");}else{var B;if(B=this.createXhrObject()){B.conn.open("GET",A,true,"logout","logout");B.conn.send("");B.conn.abort();B.conn=null;B=null;}}}catch(C){return ;}}});Ext.applyIf(Array.prototype,{map:function(B,E){var A=this.length;if(typeof B!="function"){throw new TypeError();}var D=new Array(A);for(var C=0;C<A;C++){if(C in this){try{D[C]=B.call(E||this,this[C],C,this);}catch(F){}}}return D;},forEach:function(E,B){var A=0,C=this.length;while(A<C){try{E.apply(B||this,[this[A],A++,this]);}catch(D){}}}});Ext.applyIf(Function.prototype,{forEach:function(A,E,C){C=C||A;for(var B in A){if(typeof this.prototype[B]=="undefined"){try{E.apply(C,[A[B],B,A]);}catch(D){}}}}});Ext.applyIf(String.prototype,{forEach:function(D,B){var C=this.toString();B=B||this;var A=C.split("")||[];A.forEach(function(F,E){try{D.apply(B,[F,E,C]);}catch(G){}},A);}});var forEach=function(A,D,B){B=B||A;if(A){var C=Object;if(A instanceof Function){C=Function;}else{if(A.forEach instanceof Function){A.forEach(D,B);return ;}}C.forEach(A,D,B);}};if(Ext.util.Observable){(function(){Ext.ux.ModuleManager=function(config){Ext.apply(this,config||{},{modulePath:function(){var d=location.href.indexOf("/")!=-1?"/":"\\";var u=location.href.split(d);u.pop();return u.join(d)+d;}()});this.addEvents({"loadexception":true,"alreadyloaded":true,"load":true,"beforeload":true,"complete":true});Ext.ux.ModuleManager.superclass.constructor.call(this);};Ext.extend(Ext.ux.ModuleManager,Ext.util.Observable,{disableCaching:false,modules:{},method:"GET",noExecute:false,asynchronous:false,cacheResponses:false,loaded:function(name){var module;return(module=this.getModule(name))&&module.loaded===true;},getModule:function(name){return this.modules[name]||false;},provides:function(){Ext.each(arguments,function(module){var modName=module.trim().split("/").pop().toLowerCase(),fullName=module.indexOf(".")!==-1?module.trim():module.trim()+".js";this.modules[modName]||(this.modules[modName]={name:modName.trim(),fullName:fullName.trim(),extension:fullName.split(".").pop().trim(),path:"",url:"",loaded:true,contentType:"",content:null});},this);},load:function(modList){var opt,modules;if(Ext.isArray(modList)||arguments.length==1){modules=[].concat(modList);opt=arguments[1]||{};}else{modules=Array.prototype.slice.call(arguments,0);opt={};}var result=true,keepItUp=true,StopIter="StopIteration",options=Ext.apply({async:this.asynchronous,headers:this.headers||false},opt),executed=[],loaded=[],noExecute=options.noExecute||this.noExecute||false,cacheResponses=options.cacheResponses||this.cacheResponses,disableCaching=this.disableCaching||options.disableCaching||false,method=options.method||this.method||"GET",modulePath=options.modulePath||this.modulePath,forced=options.forced||this.forced,params=options.params||null,data=null,callback={success:function(response){var module=response.argument.module,moduleName=response.argument.module.name,executable=(module.extension=="js"&&!noExecute);try{module.contentType=response.getResponseHeader["Content-Type"]||"";module.content=cacheResponses?response.responseText:null;if(this.fireEvent("beforeload",this,module,response,response.responseText)!==false){this.currentModule=moduleName;if(!options.single){this.modules[moduleName]=module;}module.loaded=true;loaded.push(module);var exception=executable?this.globalEval(response.responseText,options.target):true;if(exception===true){if(executable){executed.push(module);}try{this.fireEvent("load",this,module,response,response.responseText,executable);}catch(ex){}}else{throw Ext.applyIf({fileName:module.url,lineNumber:exception.lineNumber||0},exception);}}}catch(ex){keepItUp=this.fireEvent("loadexception",this,module,{error:ex,httpStatus:response.status,httpStatusText:response.statusText});result=false;}},failure:function(response){var module=response.argument.module;module.contentType=response.getResponseHeader?response.getResponseHeader["Content-Type"]||"":"";keepItUp=this.fireEvent("loadexception",this,module,{error:response.fullStatus.error,httpStatus:response.status,httpStatusText:response.statusText});result=false;},scope:this};if(params){if(typeof params=="function"){params=params.call(options.scope||window,options);}if(typeof params=="object"){params=Ext.urlEncode(params);}data=params;}if(options.listeners){this.on(options.listeners);}try{Ext.each(modules,function(module){var moduleName=module.trim().split("/").pop(),fullModule=(module.indexOf(".")!==-1?module:module+".js"),moduleObj={name:moduleName.trim(),fullName:fullModule.trim(),extension:fullModule.split(".").pop().trim(),path:modulePath,url:modulePath+fullModule,loaded:false,contentType:"",content:null},executable=(moduleObj.extension=="js"&&!noExecute),mod=this.getModule(moduleName);if(!mod||(mod&&!mod.loaded)||forced){if(method=="GET"){fullModule+=(params?"?"+params:"");if(disableCaching===true){fullModule+=(params?"&":"?")+"_dc="+(new Date().getTime());}data=null;}Ext.apply(callback,{argument:{module:moduleObj}});Ext.lib.Ajax.request(method,modulePath+fullModule,callback,data,options);}else{keepItUp=this.fireEvent("alreadyloaded",this,mod);if(executable){executed.push(mod);}loaded.push(mod);}if(keepItUp===false){throw StopIter;}},this);}catch(ex){if(ex!=StopIter){throw ex;}}this.fireEvent("complete",this,result,loaded,executed);if(options.callback){options.callback.call(options.scope||this,result,loaded);}this.forced=false;if(options.listeners){this.un(options.listeners);}return result;},globalEval:function(data,scope,context){scope||(scope=window);data=String(data||"").trim();if(data.length===0){return false;}try{if(scope.execScript){scope.execScript(data.replace(/^<!--/,"").replace(/-->$/,""));}else{if(Ext.isSafari){scope.setTimeout(data,0);}else{eval.call(scope,data,context||null);}}return true;}catch(ex){return ex;}},styleAdjust:null,applyStyle:function(module,styleRules,target){var doc=(target||window).document;var ct=(styleRules||module.content||"")+"";var head;if(doc&&!!ct.length&&(head=doc.getElementsByTagName("head")[0])){if(this.styleAdjust&&this.styleAdjust.pattern){ct=ct.replace(this.styleAdjust.pattern,this.styleAdjust.replacement||"");}var rules=(module||{}).element=doc.createElement("style");rules.setAttribute("type","text/css");if(Ext.isIE){head.appendChild(rules);rules.styleSheet.cssText=ct;}else{try{rules.appendChild(doc.createTextNode(ct));}catch(e){rules.cssText=ct;}head.appendChild(rules);}}return rules;},removeStyle:function(module){module&&module.element?Ext.removeNode(module.element):Ext.removeNode(module);}});}());}