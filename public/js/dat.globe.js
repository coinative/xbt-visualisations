/**
 * dat.globe Javascript WebGL Globe Toolkit
 * http://dataarts.github.com/dat.globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

function log10(val) {
  return Math.log(val) / Math.LN10;
}

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

function coordinateToPosition(lat, long) {
  var phi = (90 - lat) * Math.PI / 180;
  var theta = (180 - long) * Math.PI / 180;
  return {
    x: 200 * Math.sin(phi) * Math.cos(theta),
    y: 200 * Math.cos(phi),
    z: 200 * Math.sin(phi) * Math.sin(theta)
  };
}

var DAT = DAT || {};

var highlightedCountries = {};
var highlightCountry;
var incSpike;

DAT.Globe = function(container, colorFn) {
  colorFn = colorFn || function(x) {
    var c = new THREE.Color();
    c.setHSV( 0.2 - x, 1.0, 1.0 );
    return c;
  };

  var countryColorMap = {'PE':1,'BF':2,'FR':3,'LY':4,'BY':5,'PK':6,'ID':7,'YE':8,'MG':9,'BO':10,'CI':11,'DZ':12,'CH':13,'CM':14,'MK':15,'BW':16,'UA':17,'KE':18,'TW':19,'JO':20,'MX':21,'AE':22,'BZ':23,'BR':24,'SL':25,'ML':26,'CD':27,'IT':28,'SO':29,'AF':30,'BD':31,'DO':32,'GW':33,'GH':34,'AT':35,'SE':36,'TR':37,'UG':38,'MZ':39,'JP':40,'NZ':41,'CU':42,'VE':43,'PT':44,'CO':45,'MR':46,'AO':47,'DE':48,'SD':49,'TH':50,'AU':51,'PG':52,'IQ':53,'HR':54,'GL':55,'NE':56,'DK':57,'LV':58,'RO':59,'ZM':60,'IR':61,'MM':62,'ET':63,'GT':64,'SR':65,'EH':66,'CZ':67,'TD':68,'AL':69,'FI':70,'SY':71,'KG':72,'SB':73,'OM':74,'PA':75,'AR':76,'GB':77,'CR':78,'PY':79,'GN':80,'IE':81,'NG':82,'TN':83,'PL':84,'NA':85,'ZA':86,'EG':87,'TZ':88,'GE':89,'SA':90,'VN':91,'RU':92,'HT':93,'BA':94,'IN':95,'CN':96,'CA':97,'SV':98,'GY':99,'BE':100,'GQ':101,'LS':102,'BG':103,'BI':104,'DJ':105,'AZ':106,'MY':107,'PH':108,'UY':109,'CG':110,'RS':111,'ME':112,'EE':113,'RW':114,'AM':115,'SN':116,'TG':117,'ES':118,'GA':119,'HU':120,'MW':121,'TJ':122,'KH':123,'KR':124,'HN':125,'IS':126,'NI':127,'CL':128,'MA':129,'LR':130,'NL':131,'CF':132,'SK':133,'LT':134,'ZW':135,'LK':136,'IL':137,'LA':138,'KP':139,'GR':140,'TM':141,'EC':142,'BJ':143,'SI':144,'NO':145,'MD':146,'LB':147,'NP':148,'ER':149,'US':150,'KZ':151,'AQ':152,'SZ':153,'UZ':154,'MN':155,'BT':156,'NC':157,'FJ':158,'KW':159,'TL':160,'BS':161,'VU':162,'FK':163,'GM':164,'QA':165,'JM':166,'CY':167,'PR':168,'PS':169,'BN':170,'TT':171,'CV':172,'PF':173,'WS':174,'LU':175,'KM':176,'MU':177,'FO':178,'ST':179,'AN':180,'DM':181,'TO':182,'KI':183,'FM':184,'BH':185,'AD':186,'MP':187,'PW':188,'SC':189,'AG':190,'BB':191,'TC':192,'VC':193,'LC':194,'YT':195,'VI':196,'GD':197,'MT':198,'MV':199,'KY':200,'KN':201,'MS':202,'BL':203,'NU':204,'PM':205,'CK':206,'WF':207,'AS':208,'MH':209,'AW':210,'LI':211,'VG':212,'SH':213,'JE':214,'AI':215,'MF_1_':216,'GG':217,'SM':218,'BM':219,'TV':220,'NR':221,'GI':222,'PN':223,'MC':224,'VA':225,'IM':226,'GU':227,'SG':228};

  var Shaders = {
    'earth-indexed' : {
      uniforms: {
        'outlineTexture': { type: 't', value: null },
        'indexedTexture': { type: 't', value: null },
        'lookupTexture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);',
          'vNormal = normalize(normalMatrix * normal);',
          'vUv = uv + vec2(0.472, 0.008);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D outlineTexture;',
        'uniform sampler2D indexedTexture;',
        'uniform sampler2D lookupTexture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'float indexedColor = texture2D(indexedTexture, vUv).x;',
          'vec4 lookupColor = texture2D(lookupTexture, vec2(indexedColor, 0.));',
          'vec4 outlineColor = texture2D(outlineTexture, vUv);',
          'vec4 diffuse = lookupColor + outlineColor;',

          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = diffuse + vec4( atmosphere, 1.0 );',

          //'gl_FragColor = diffuse;',
        '}'
      ].join('\n')
    },
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv + vec2(0.472, 0.008)).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var lookupCanvas, lookupTexture;

  var camera, scene, sceneAtmosphere, renderer, w, h;
  var earth, atmosphere;


  Object.keys(countryColorMap).forEach(function (countryCode) {
    highlightedCountries[countryCode] = { count: 0, amount: 0, h: 0, l: 0 };
  });

  highlightCountry = function(countryCode, amount) {
    var country = highlightedCountries[countryCode];
    country.count++;
    country.amount += amount;
    country.h = clamp(log10(country.amount) * 48, 0, 240);
    country.l = 100;
  }

  var spikes = {};

  incSpike = function (latitude, longitude) {
    var key = '' + latitude + longitude;
    var spike = spikes[key];
    var geometry;
    if (!spike) {
      geometry = new THREE.CubeGeometry(0.75, 0.75, 1, 1, 1, 1, undefined, { px: true, nx: true, py: true, ny: true, pz: false, nz: true});
      geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0,0,0.5) );
      geometry.dynamic = true;

      spike = spikes[key] = {
        mesh: new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors })),
        count: 1
      };

      var position = coordinateToPosition(latitude, longitude);
      spike.mesh.position.x = position.x;
      spike.mesh.position.y = position.y;
      spike.mesh.position.z = position.z;
      spike.mesh.lookAt(earth.position);

      for (var i = 0; i < geometry.faces.length; i++) {
        geometry.faces[i].color = colorFn(0.5);
      }

      scene.add(spike.mesh);
    } else {
      geometry = spike.mesh.geometry;
      spike.count++;
    }
    spike.mesh.scale.z = -(log10(spike.count) * 25 - 10);
    for (var i = 0; i < geometry.faces.length; i++) {
      geometry.faces[i].color = colorFn(clamp(log10(spike.count) * (0.2 / 3), 0, 0.2)); // 0.0 -> 0.2
    }
    geometry.colorsNeedUpdate = true;
    spike.mesh.updateMatrix();
  }

  function animateCountries() {
    var ctx = lookupCanvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 10);
    ctx.fillStyle = 'rgb(10, 10, 40)';
    ctx.fillRect(0, 0, 1, 1);
    Object.keys(highlightedCountries).forEach(function (countryCode) {
      var country = highlightedCountries[countryCode];
      var fillCSS = 'hsl(' + (240 - country.h) + ', 50%, ' + country.l + '%)';
      ctx.fillStyle = fillCSS;
      var colorIndex = countryColorMap[countryCode];
      ctx.fillRect(colorIndex, 0, 1, 10);
      if (country.l > 50) {
        country.l -= 2;
        lookupTexture.needsUpdate = true;
      }
    });
  }

  function initEarth() {
    var earthGeometry = new THREE.SphereGeometry(200, 40, 30);
    earthGeometry.dynamic = true;

    shader = Shaders['earth-indexed'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    var outlineTexture = THREE.ImageUtils.loadTexture('/images/map_outline.png');
    outlineTexture.wrapS = THREE.RepeatWrapping;
    uniforms['outlineTexture'].value = outlineTexture;

    var indexedTexture = THREE.ImageUtils.loadTexture('/images/map_indexed.png');
    indexedTexture.wrapS = THREE.RepeatWrapping;
    indexedTexture.magFilter = THREE.NearestFilter;
    indexedTexture.minFilter = THREE.NearestFilter;
    uniforms['indexedTexture'].value = indexedTexture;

    lookupCanvas = document.createElement('canvas');
    lookupCanvas.width = 256;
    lookupCanvas.height = 10;
    document.getElementsByTagName('body')[0].appendChild(lookupCanvas);
    lookupTexture = new THREE.Texture(lookupCanvas);
    lookupTexture.magFilter = THREE.NearestFilter;
    lookupTexture.minFilter = THREE.NearestFilter;
    uniforms['lookupTexture'].value = lookupTexture;

    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    earth = new THREE.Mesh(earthGeometry, material);
    scene.add(earth);

    shader = Shaders['atmosphere'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      side: THREE.BackSide
    });

    atmosphere = new THREE.Mesh(earthGeometry, material);
    atmosphere.scale.x = atmosphere.scale.y = atmosphere.scale.z = 1.1;
    sceneAtmosphere.add(atmosphere);
  }

  //
  // Largely unchanged below here.
  //
  var overRenderer;

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var mouse = { x: 0, y: 0 };
  var mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 };
  var target = { x: Math.PI * (3 / 2), y: Math.PI / 6.0 };
  var targetOnDown = { x: 0, y: 0 };

  var distance = 100000;
  var distanceTarget = 100000;
  var padding = 40;
  var PI_HALF = Math.PI / 2;

  function init() {
    container.style.color = '#fff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();
    sceneAtmosphere = new THREE.Scene();

    initEarth();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.autoClear = false;
    renderer.setClearColorHex(0x000000, 0.0);
    renderer.setSize(w, h);

    renderer.domElement.style.position = 'absolute';
    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);
    container.addEventListener('mousewheel', onMouseWheel, false);

    document.addEventListener('keydown', onDocumentKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);
  }

  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }

  function onMouseUp(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onDocumentKeyDown(event) {
    switch (event.keyCode) {
      case 38:
        zoom(100);
        event.preventDefault();
        break;
      case 40:
        zoom(-100);
        event.preventDefault();
        break;
    }
  }

  function onWindowResize( event ) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }


  function animate() {
    requestAnimationFrame(animate);

    animateCountries();

    render();
  }

  function render() {
    zoom(curZoomSpeed);

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);
    camera.lookAt(scene.position);

    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(sceneAtmosphere, camera);
  }

  init();

  this.animate = animate;
  this.renderer = renderer;
  this.scene = scene;

  return this;
};

