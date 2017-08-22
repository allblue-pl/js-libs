const jsLibs = new ((() => { 'use strict';


class JSLibs
{

    get Require()
    { let self = this;
        return Require;
    }


    constructor()
    { let self = this;
        self._packages = {};
    }

    exportModule(package_name, module_path, module_init_fn)
    { let self = this;
        if (!(package_name in self._packages))
            self._packages[package_name] = new Package(self, package_name);

        self._packages[package_name].addModule(module_path, module_init_fn);
    }

    importModule(package_name, module_path)
    { let self = this;
        if (!(package_name in self._packages)) {
            throw new Error('Package `' + package_name +
                    '` does not exist.');
        }

        return self._packages[package_name].importModule(module_path);
    }

    require(package_name)
    { let self = this;
        return self.importModule(package_name, 'index');
    }


    _parsePackagePath(package_path)
    { let self = this;
        return package_path;
    }

}


class Module
{

    get instance()
    { let self = this;
        if (self._instance === null) {
            let require = new Require(self._package.jsLibs, self._package.name,
                    self._path);
            let module = {
                exports: null
            };

            self._instance = self._initFn(require.fn, module);

            if (module.exports === null) {
                throw new Error('No `exports` found in module `' +
                        self._package.name + '/' + self._path + '`.');
            }
            self._instance = module.exports;
        }

        return self._instance;
    }


    constructor(js_lib_package, module_path, init_fn)
    { let self = this;
        self._package = js_lib_package;
        self._path = module_path;
        self._initFn = init_fn;

        self._instance = null;
    }

}


class Package
{

    constructor(js_libs, package_name)
    { let self = this;
        self.jsLibs = js_libs;
        self.name = package_name;

        self._modules = {};
    }

    addModule(module_path, module_init_fn)
    { let self = this;
        self._modules[module_path] = new Module(self, module_path, module_init_fn);
    }

    importModule(module_path)
    { let self = this;
        if (module_path in self._modules)
            return self._modules[module_path].instance;

        module_path += '/index';
        if (module_path in self._modules)
            return self._modules[module_path].instance;

        return null;
    }

}


class Require
{

    get fn()
    { let self = this;
        return self._fn;
    }


    constructor(js_libs, package_name = null, current_path = null)
    { let self = this;
        self._packageName = package_name;
        self._currentPath_Array = null;

        self._fn = (import_path) => {
            let import_info = self._resolveImportInfo(import_path);

            let module = js_libs.importModule(import_info.packageName,
                    import_info.modulePath);
            if (module === null) {
                throw new Error('Module `' + import_path + '` (`' +
                        import_info.packageName + ':' + import_info.modulePath +
                        '`) does not exist.');
            }

            return module
        };

        if (current_path !== null) {
            self._currentPath_Array = current_path.split('/');
            self._currentPath_Array.pop();
        }
    }


    _resolveImportInfo(import_path)
    { let self = this;
        let import_path_array = import_path.split('/');

        /* Import Package */
        if (import_path_array[0] !== '.' && import_path_array[0] !== '..') {
            return {
                packageName: import_path_array[0],
                modulePath: 'index',
            };
        }

        if (self._packageName === null)
            throw new Error('Cannot import module outside of package.');

        /* Import Module */
        let module_path_array = self._currentPath_Array.slice();

        for (let i = 0; i < import_path_array.length; i++) {
            if (import_path_array[i] === '.')
                continue;

            if (import_path_array[i] === '..') {
                module_path_array.pop();
                continue;
            }

            module_path_array.push(import_path_array[i]);
        }

        return {
            packageName: self._packageName,
            modulePath: module_path_array.join('/'),
        };
    }

}


return JSLibs;

})())();

const require = (new jsLibs.Require(jsLibs)).fn;
