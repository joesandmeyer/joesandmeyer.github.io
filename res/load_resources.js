function loadScript(url, onLoadCallback) {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = false;  // ensure the script loads in order
    script.onload = onLoadCallback; // set the onload callback
    document.head.appendChild(script);
}

// preload js directories
const js_dirs = [
    './res/js/func.js',
    './res/json/starmaze.js',
    './res/js/init.js',
    './res/js/obj.js',
    './res/js/layouts.js'
];

let scripts_loaded = 0;
let scripts_complete = false;
let layouts_complete = false;

function loadScriptCB() {
    if (scripts_loaded >= js_dirs.length - 1) {
        loadComplete();
        return;
    }
    scripts_loaded++;
    // callback makes sure to load next script when previous script ends
    loadScript(js_dirs[scripts_loaded], loadScriptCB);
}

function layoutsLoaded() {
    //console.log("Layouts Loaded.");
    layouts_complete = true;
    if (scripts_complete) {
        //console.log("Load Complete.");
        const event = new CustomEvent('loadComplete', { });
        document.dispatchEvent(event);
    }
}

function loadComplete() {
    //console.log("Objects Loaded.");
    scripts_complete = true;
    if (layouts_complete) {
        //onsole.log("Load Complete.");
        const event = new CustomEvent('loadComplete', { });
        document.dispatchEvent(event);
    }
}

document.addEventListener('layoutsLoaded', (event) => {
    layoutsLoaded();
});

// load first script in the chain
loadScript(js_dirs[0], loadScriptCB);