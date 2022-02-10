"use strict";
switch (process.argv[2]) {
    case 'init':
        require('./dist/init');
        break;
    case 'encoder':
        require('./dist/encoder');
        break;
    default:
        require('./dist/index');
        break;
}