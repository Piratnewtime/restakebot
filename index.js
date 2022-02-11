"use strict";
switch (process.argv[2]) {
    case 'init':
        require('./dist/init');
        break;
    case 'add_wallet':
    case 'add':
        require('./dist/add_wallet');
        break;
    case 'encoder':
        require('./dist/encoder');
        break;
    case 'change_password':
    case 'change_pass':
    case 'repass':
        require('./dist/change_pass');
        break;
    default:
        require('./dist/index');
        break;
}