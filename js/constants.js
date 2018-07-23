(function() {
    'use strict';

    angular.module('walletApp')
        .constant('constants.network', {
            NETWORK_NAME: 'devel', // 'devnet', 'testnet', 'mainnet'
            ADDRESS_VERSION: 1,
            NETWORK_CODE: 'T', // T:TestNet, W:MainNet
            INITIAL_NONCE: 0
        });

    angular.module('walletApp')
        .constant('constants.address', {
            RAW_ADDRESS_LENGTH : 35,
            ADDRESS_PREFIX: '1W',
            MAINNET_ADDRESS_REGEXP: /^[a-zA-Z0-9]{35}$/
        });

    angular.module('walletApp')
        .constant('constants.features', {
            ALIAS_VERSION: 2
        });

    angular.module('walletApp')
        .constant('constants.transactions', {
            PAYMENT_TRANSACTION_TYPE : 2,
            ASSET_ISSUE_TRANSACTION_TYPE: 3,
            ASSET_TRANSFER_TRANSACTION_TYPE: 4,
            ASSET_REISSUE_TRANSACTION_TYPE: 5,
            EXCHANGE_TRANSACTION_TYPE: 7,
            START_LEASING_TRANSACTION_TYPE: 8,
            CANCEL_LEASING_TRANSACTION_TYPE: 9,
            CREATE_ALIAS_TRANSACTION_TYPE: 10,
            MAKE_ASSET_NAME_UNIQUE_TRANSACTION_TYPE: 11,
            ASSET_FEE_SPONSORSHIP_TYPE: 14
        });
})();
