/*! For license information please see 9538.4834557a.chunk.js.LICENSE.txt */
(self.webpackChunkidle_dashboard_new=self.webpackChunkidle_dashboard_new||[]).push([[9538,7413],{39538:function(e,n,t){"use strict";t.r(n),t.d(n,{VaultsCarousel:function(){return f}});t(37413),t(7276);var a=t(10604),i=t(3498),r=t(95173),o=t(12056),l=t(23537),d=t(66288),s=t(75349),u=t(1669),c=t(45263),f=function(){var e=(0,r.s0)(),n=(0,d.X)().isMobile,t=(0,u.w)(),f=t.vaults,p=t.isPortfolioLoaded,v=t.selectors.selectAssetById;return p?(0,c.jsx)(i.Ug,{mt:2,left:0,zIndex:1,spacing:2,width:"100%",overflow:"hidden",position:"absolute",children:(0,c.jsx)(a.Z,{gradient:!1,pauseOnHover:!0,speed:n?40:15,children:(0,c.jsx)(i.Ug,{ml:2,spacing:2,children:f.map((function(n){var t=o.A[n.type];if(!t||!t.route)return null;var a=v(n.id);if(!a||(0,l.d5)(a.apr).lte(0)||["paused","deprecated"].includes(a.status))return null;var i=(0,l.qC)("earn",[t.route]);return(0,c.jsx)(s.VaultCard.Inline,{showDivider:!1,assetId:"".concat(n.id),onClick:function(){return e("".concat(i,"/").concat(n.id))},fields:[{field:"apy",label:"defi.apy",labelPos:"right",props:{}},{field:"productTag",props:{px:3}},{field:"strategies",props:{ml:0,maxW:"initial"},parentProps:{ml:"1 !important"}}]},"vault_".concat(n.id))}))})})}):null}},10604:function(e,n,t){var a=t(7276);function i(e){return e&&"object"===typeof e&&"default"in e?e:{default:e}}var r=i(a),o=function(){return o=Object.assign||function(e){for(var n,t=1,a=arguments.length;t<a;t++)for(var i in n=arguments[t])Object.prototype.hasOwnProperty.call(n,i)&&(e[i]=n[i]);return e},o.apply(this,arguments)};!function(e){if(e&&"undefined"!==typeof window){var n=document.createElement("style");n.setAttribute("type","text/css"),n.innerHTML=e,document.head.appendChild(n)}}('.marquee-container {\n  overflow-x: hidden !important;\n  display: flex !important;\n  flex-direction: row !important;\n  position: relative;\n  width: 100%;\n}\n.marquee-container:hover div {\n  animation-play-state: var(--pause-on-hover);\n}\n.marquee-container:active div {\n  animation-play-state: var(--pause-on-click);\n}\n\n.overlay {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n}\n.overlay::before, .overlay::after {\n  background: linear-gradient(to right, var(--gradient-color));\n  content: "";\n  height: 100%;\n  position: absolute;\n  width: var(--gradient-width);\n  z-index: 2;\n}\n.overlay::after {\n  right: 0;\n  top: 0;\n  transform: rotateZ(180deg);\n}\n.overlay::before {\n  left: 0;\n  top: 0;\n}\n\n.marquee {\n  flex: 0 0 auto;\n  min-width: 100%;\n  z-index: 1;\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  animation: scroll var(--duration) linear var(--delay) var(--iteration-count);\n  animation-play-state: var(--play);\n  animation-delay: var(--delay);\n  animation-direction: var(--direction);\n}\n@keyframes scroll {\n  0% {\n    transform: translateX(0%);\n  }\n  100% {\n    transform: translateX(-100%);\n  }\n}');n.Z=function(e){var n,t,i,l,d=e.style,s=void 0===d?{}:d,u=e.className,c=void 0===u?"":u,f=e.play,p=void 0===f||f,v=e.pauseOnHover,m=void 0!==v&&v,y=e.pauseOnClick,h=void 0!==y&&y,g=e.direction,w=void 0===g?"left":g,b=e.speed,x=void 0===b?20:b,C=e.delay,E=void 0===C?0:C,k=e.loop,q=void 0===k?0:k,j=e.gradient,O=void 0===j||j,z=e.gradientColor,A=void 0===z?[255,255,255]:z,I=e.gradientWidth,N=void 0===I?200:I,_=e.onFinish,L=e.onCycleComplete,P=e.children,R=a.useState(0),B=R[0],H=R[1],S=a.useState(0),X=S[0],Z=S[1],F=a.useState(!1),M=F[0],T=F[1],U=a.useRef(null),V=a.useRef(null);a.useEffect((function(){if(M){var e=function(){V.current&&U.current&&(H(U.current.getBoundingClientRect().width),Z(V.current.getBoundingClientRect().width))};return e(),window.addEventListener("resize",e),function(){window.removeEventListener("resize",e)}}}),[M]),a.useEffect((function(){T(!0)}),[]);var W="rgba("+A[0]+", "+A[1]+", "+A[2],D=X<B?B/x:X/x;return r.default.createElement(a.Fragment,null,M?r.default.createElement("div",{ref:U,style:o(o({},s),(n={},n["--pause-on-hover"]=!p||m?"paused":"running",n["--pause-on-click"]=!p||m&&!h||h?"paused":"running",n)),className:c+" marquee-container"},O&&r.default.createElement("div",{style:(t={},t["--gradient-color"]=W+", 1), "+W+", 0)",t["--gradient-width"]="number"===typeof N?N+"px":N,t),className:"overlay"}),r.default.createElement("div",{ref:V,style:(i={},i["--play"]=p?"running":"paused",i["--direction"]="left"===w?"normal":"reverse",i["--duration"]=D+"s",i["--delay"]=E+"s",i["--iteration-count"]=q?""+q:"infinite",i),className:"marquee",onAnimationIteration:L,onAnimationEnd:_},P),r.default.createElement("div",{style:(l={},l["--play"]=p?"running":"paused",l["--direction"]="left"===w?"normal":"reverse",l["--duration"]=D+"s",l["--delay"]=E+"s",l["--iteration-count"]=q?""+q:"infinite",l),className:"marquee","aria-hidden":"true"},P)):null)}},37413:function(e,n,t){"use strict";t.r(n),n.default={}}}]);