(function()
{
    "use strict"

    var scriptTag = document.currentScript;
    var loaded = false;

    if (!document.currentScript) {
        // not supported in IE
        var scripts = document.getElementsByTagName("script");
        scriptTag = scripts[scripts.length - 1];
    }

    if (!window.Tonic)
    {
        var link = document.createElement("a");
        link.href = scriptTag.src;

        var host = link.host.split(".");
        if (host.length === 3) { host = host.slice(1) }
        var scriptOrigin = "https://" + host.join(".");

        var COUNTER = 0;
        var MESSAGE_ID = 1;
        var CALLBACKS = {};

        var Notebook = function(options)
        {
            var name = this.name = "tonic-embed-" + (COUNTER++).toString();
            window.Tonic["$"+name] = this;

            var element = options.element;
            var source = options.source;
            var readOnly = options.readOnly;
            var fromNotebook = options.notebookURL;
            var nodeVersion = options.nodeVersion;
            var title = options.title;
            var initialHeight = 100;

            if (source)
            {
                initialHeight = source.split("\n").length * 21 + 10;
            }

            if (fromNotebook)
            {
                var parts = fromNotebook.split('/');

                // ignore first and last slashes

                if (parts[0] === '')
                    parts.shift();

                if (parts[parts.length - 1] === '')
                    parts.pop();

                if (parts.length < 2)
                {
                    fromNotebook = null;
                }
                else
                {
                    var author = parts[0];
                    var repo = parts[1];
                    var canonicalParts = ['', 'users', author, 'repositories', repo];

                    if (parts.length > 2)
                        canonicalParts = canonicalParts.concat(parts.slice(2));
                    else
                        canonicalParts = canonicalParts.concat(['branches', 'master']);

                    fromNotebook = canonicalParts.join('/');
                }
            }

            console.log('LOCATION = ' + window.location.toString());

            var notebookQuery = {
                name: name,
                notebook: fromNotebook,
                source: (source || "").trim(),
                location: window.location.toString(),
                readOnly: readOnly,
                nodeVersion: nodeVersion,
                title: title
            };

            var notebookQueryString = "?" + Object.keys(notebookQuery).map(function(aKey) {
                if (notebookQuery[aKey] !== undefined && notebookQuery[aKey] !== null)
                    return aKey + "=" + encodeURIComponent(notebookQuery[aKey])
            }).filter(function(aString){ return !!aString }).join("&");

            if (Array.isArray(options.env))
            {
                notebookQueryString += "&" + options.env.map(function(anEnv) {
                    return "env[]=" + encodeURIComponent(anEnv);
                }).join("&")
            }

            var iframe = this.iframe = document.createElement("iframe");

            iframe.src = scriptOrigin + "/e" + notebookQueryString;

            console.log('iframe src = ' + iframe.src);
            iframe.style.height = (Math.max(100, initialHeight) + 50) + "px";
            iframe.style.width = "100%";
            iframe.style.width = "calc(100% + 200px)";
            iframe.style.padding = "0px";
            iframe.style.margin = "0px";
            iframe.style.marginLeft = "calc(-100px)";
            iframe.style.border = "0px";
            iframe.style.backgroundColor = "transparent";
            iframe.frameBorder = "0";
            iframe.allowTransparency="true";
            iframe.name = name;

            element.appendChild(iframe);

            window.addEventListener("message", function(message)
            {
                try {
                    var parsed = JSON.parse(message.data);
                    if (parsed && parsed.name === name)
                    {
                        if (parsed.height) {
                            iframe.style.height = (parsed.height + 50) + "px";
                        } else if (parsed.event === "loaded") {
                            if (options.onLoad) {
                                options.onLoad(this)
                            }
                        } else if (parsed.url) {
                            this.URL = scriptOrigin + parsed.url;
                            if (options.onURLChanged) {
                                options.onURLChanged(this.URL);
                            }
                        } else if (parsed.message_id && CALLBACKS[parsed.message_id]) {
                            var callback = CALLBACKS[parsed.message_id];
                            delete CALLBACKS[parsed.message_id];

                            callback(parsed.message)
                        }
                    }
                } catch(e) {
                }
            }.bind(this));
        }

        Notebook.prototype._sendMessage = function(data, callback)
        {
            var messageID = MESSAGE_ID++;
            CALLBACKS[messageID] = callback;

            var message = {
                name: this.name,
                message_id: messageID,
                message: data
            }

            this.iframe.contentWindow.postMessage(JSON.stringify(message), "*")
        }

        Notebook.prototype.getSource = function(callback)
        {
            this._sendMessage({ method: "get_source" }, callback);
        }

        Notebook.prototype.setSource = function(source, callback)
        {
            this._sendMessage({ method: "set_source", source: source }, callback);
        }

        Notebook.prototype.evaluate = function(callback)
        {
            this._sendMessage({ method: "evaluate" }, callback);
        }

        window.Tonic = {
            createNotebook: function(options) {
                return new Notebook(options);
            }
        }
    }

    function onLoad()
    {
        loaded = true;

        var elementID = scriptTag.getAttribute("data-element-id");
        var notebookURL = scriptTag.getAttribute("data-notebook-url");
        var loadCallbackName = scriptTag.getAttribute("data-load-callback");
        var nodeVersion = scriptTag.getAttribute("data-node-version");
        var title = scriptTag.getAttribute("data-title");

        var envs = [].filter.call(scriptTag.attributes, function(attr) {
            return /^data-env-/.test(attr.name);
        }).map(function(attr){
            return attr.name.replace("data-env-", "").toLowerCase() + "=" + attr.value
        });

        if (!elementID && !notebookURL)
            return;

        var existingElement = elementID && document.getElementById(elementID);
        var existingSource = existingElement && (existingElement.textContent || existingElement.innerText);
        var readOnly = scriptTag.hasAttribute("data-read-only");

        if (existingSource)
        {
            // clear out the existing element's content
            existingElement.innerHTML = "";

            // reformat the text (here we ltrim)
            existingSource = existingSource.replace(/\r\n/g, "\n");
            existingSource = existingSource.replace(/\r/g, "\n");

            var lines = existingSource.split("\n");

            // remove empty preceeding lines
            while (lines.length && lines[0].trim().length === 0) lines.shift();

            // find the indentation of the first line
            var prefix = lines.length > 0 && lines[0].length - lines[0].replace(/^\s+/,"").length;

            // strip that indentation from subsequent lines
            existingSource = lines.map(function(line)
            {
                if (line.substring(0, prefix).match(/[^\s]/))
                    return line
                else
                    return line.substring(prefix);
            }).join("\n");
        }

        if (!existingElement)
        {
            existingElement = document.createElement("div");
            existingElement.className = "tonic-notebook-container";
            scriptTag.parentNode.replaceChild(existingElement, scriptTag);
        }

        function loadCallback() {
            if (window[loadCallbackName]) {
                window[loadCallbackName]()
            }
        }

        Tonic.createNotebook({
            element: existingElement,
            source: existingSource,
            notebookURL: notebookURL,
            readOnly: readOnly,
            env: envs,
            nodeVersion: nodeVersion,
            title: title,
            onLoad: loadCallbackName && loadCallback
        })
    }

    if (document.readyState === "complete")
        onLoad();
    else
        window.addEventListener('load', onLoad);

})()
