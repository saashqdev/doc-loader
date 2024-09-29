const fs = require('fs');
const path = require('path');
const kubevue = require('kubevue-api');
const loaderUtils = require('loader-utils');

const defaults = require('./defaults');
const _ = require('./utils');

// Generate routes in the form of string concatenation
module.exports = function (content) {
    const config = loaderUtils.getOptions(this);
    // Used to update docs document cache in real time
    config.docs = kubevue.config.resolve(process.cwd()).docs;

    const srcPath = config.srcPath;
    const libraryPath = config.libraryPath;

    this.cacheable();
    // The cost of dynamically monitoring directory changes is too high. It is best to only monitor directory changes.
    // this.addContextDependency(srcPath || libraryPath);
    // @TODO: Dynamically monitor configuration changes
    this.addDependency(config.configPath);
    this.addDependency(config.packagePath);

    // Dynamically generate routes
    const docLoaderViewsPath = path.resolve(__dirname, '../views');
    this.addContextDependency(docLoaderViewsPath);
    const flatRoutesList = [_.getFlatRoutes(docLoaderViewsPath)];
    const cwdViewsPath = path.resolve(process.cwd(), 'docs/views');
    if (fs.existsSync(cwdViewsPath)) {
        this.addContextDependency(cwdViewsPath);
        flatRoutesList.push(_.getFlatRoutes(cwdViewsPath));
    }
    if (config.docs && config.docs.routes)
        flatRoutesList.push(config.docs.routes);

    const routes = _.nestRoutes(_.mergeFlatRoutes(...flatRoutesList));

    let components; let vendors; let blocks; let directives; let filters; let utils; let misc; let layouts;
    if (config.type === 'component' || config.type === 'block') {
        components = _.getMaterial(srcPath, 'components');
        flatRoutesList[0]['/components'] && _.setChildren(flatRoutesList[0]['/components'], components);
    } else {
        // Dynamically generate components, blocks, directives, filters, and tools
        // @compat:
        let componentsPath = path.join(libraryPath, 'components');
        if (!fs.existsSync(componentsPath))
            componentsPath = libraryPath;
        components = _.getMaterials(componentsPath, config.docs && config.docs.components, 'components');
        flatRoutesList[0]['/components'] && _.setChildren(flatRoutesList[0]['/components'], components);

        const blocksPath = path.join(srcPath, 'blocks');
        blocks = _.getMaterials(blocksPath, config.docs && config.docs.blocks, 'blocks');
        flatRoutesList[0]['/blocks'] && _.setChildren(flatRoutesList[0]['/blocks'], blocks);

        const vendorsPath = path.resolve(process.cwd(), 'packages');
        vendors = _.getMaterials(vendorsPath, config.docs && config.docs.vendors, 'vendors');
        flatRoutesList[0]['/vendors'] && _.setChildren(flatRoutesList[0]['/vendors'], vendors);

        const directivesPath = path.join(srcPath, 'directives');
        directives = _.getMaterials(directivesPath, config.docs && config.docs.directives, 'directives');
        const filtersPath = path.join(srcPath, 'filters');
        filters = _.getMaterials(filtersPath, config.docs && config.docs.filters, 'filters');
        const utilsPath = path.join(srcPath, 'utils');
        utils = _.getMaterials(utilsPath, config.docs && config.docs.utils, 'utils');

        misc = [].concat(directives, filters, utils);
        flatRoutesList[0]['/misc'] && _.setChildren(flatRoutesList[0]['/misc'], misc);

        const layoutsPath = path.join(libraryPath, 'layouts');
        layouts = _.getMaterials(layoutsPath, config.docs && config.docs.layouts, 'layouts');
        flatRoutesList[0]['/layouts'] && _.setChildren(flatRoutesList[0]['/layouts'], layouts);
    }

    const outputs = [];
    const $docs = Object.assign({}, defaults, config.docs, {
        componentsGroups: components && _.groupMaterials(components),
        vendorsGroups: vendors && _.groupMaterials(vendors),
        blocksGroups: blocks && _.groupMaterials(blocks),
        miscGroups: misc && _.groupMaterials(misc),
        layoutsGroups: layouts && _.groupMaterials(layouts),
        package: require(config.packagePath),
    });

    // Theme parameters can only be added during dev, and there may be multiple different packages during build.
    if (process.env.NODE_ENV === 'development')
        $docs.theme = config.theme;

    outputs.push('const $docs = ' + JSON.stringify($docs));
    outputs.push('$docs.routes = ' + _.renderRoutes(routes));
    outputs.push('export default $docs');
    return outputs.join(';\n');
};
