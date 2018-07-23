(function() {
  'use strict';

  function SignService(txConstants, featureConstants, cryptoService, utilityService) {
    var self = this;

    // Transaction types

    self.getAssetIssueTxTypeBytes = function() {
      return [txConstants.ASSET_ISSUE_TRANSACTION_TYPE];
    };

    self.getAssetReissueTxTypeBytes = function() {
      return [txConstants.ASSET_REISSUE_TRANSACTION_TYPE];
    };

    self.getAssetTransferTxTypeBytes = function() {
      return [txConstants.ASSET_TRANSFER_TRANSACTION_TYPE];
    };

    self.getStartLeasingTxTypeBytes = function() {
      return [txConstants.START_LEASING_TRANSACTION_TYPE];
    };

    self.getCancelLeasingTxTypeBytes = function() {
      return [txConstants.CANCEL_LEASING_TRANSACTION_TYPE];
    };

    self.getCreateAliasTxTypeBytes = function() {
      return [txConstants.CREATE_ALIAS_TRANSACTION_TYPE];
    };

    self.getAssetSponsorshipTxTypeBytes = function() {
      return [txConstants.ASSET_FEE_SPONSORSHIP_TYPE];
    };

    // Keys

    self.getPublicKeyBytes = function(publicKey) {
      return utilityService.base58StringToByteArray(publicKey);
    };

    self.getPrivateKeyBytes = function(privateKey) {
      return cryptoService.base58.decode(privateKey);
    };

    // Data fields

    self.getNetworkBytes = function() {
      return [utilityService.getNetworkIdByte()];
    };

    self.getTransactionIdBytes = function(tx) {
      return utilityService.base58StringToByteArray(tx);
    };

    self.getRecipientBytes = function(recipient) {
      if (recipient.slice(0, 6) === 'alias:') {
        return [].concat(
          [featureConstants.ALIAS_VERSION], [utilityService.getNetworkIdByte()],
          utilityService.stringToByteArrayWithSize(recipient.slice(8)) // Remove leading 'asset:W:'
        );
      } else {
        return utilityService.base58StringToByteArray(recipient);
      }
    };

    self.getAssetIdBytes = function(assetId, mandatory) {
      if (mandatory) {
        return utilityService.base58StringToByteArray(assetId);
      } else {
        return assetId ? [1].concat(utilityService.base58StringToByteArray(assetId)) : [0];
      }
    };

    self.getAssetNameBytes = function(assetName) {
      return utilityService.stringToByteArrayWithSize(assetName);
    };

    self.getAssetDescriptionBytes = function(assetDescription) {
      return utilityService.stringToByteArrayWithSize(assetDescription);
    };

    self.getAssetQuantityBytes = function(assetQuantity) {
      return utilityService.longToByteArray(assetQuantity);
    };

    self.getAssetDecimalPlacesBytes = function(assetDecimalPlaces) {
      return [assetDecimalPlaces];
    };

    self.getAssetIsReissuableBytes = function(assetIsReissuable) {
      return utilityService.booleanToBytes(assetIsReissuable);
    };

    self.getAmountBytes = function(amount) {
      return utilityService.longToByteArray(amount);
    };

    self.getFeeAssetIdBytes = function(feeAssetId) {
      return self.getAssetIdBytes(feeAssetId);
    };

    self.getFeeBytes = function(fee) {
      return utilityService.longToByteArray(fee);
    };

    self.getTimestampBytes = function(timestamp) {
      return utilityService.longToByteArray(timestamp);
    };

    self.getAttachmentBytes = function(attachment) {
      return utilityService.byteArrayWithSize(attachment);
    };

    self.getStringAttachmentBytes = function(attacment){
      return utilityService.stringToByteArrayWithSize(attacment);
    };

    self.getStringToBytes = function(str){
      return utilityService.stringToByteArray(str);
    }

    self.getAliasBytes = function(alias) {
      return utilityService.byteArrayWithSize([].concat(
        [featureConstants.ALIAS_VERSION], [utilityService.getNetworkIdByte()],
        utilityService.stringToByteArrayWithSize(alias)
      ));
    };

    self.getOrderTypeBytes = function(orderType) {
      return utilityService.booleanToBytes(orderType);
    };

    self.getOrderIdBytes = function(orderId) {
      return utilityService.base58StringToByteArray(orderId);
    };

    // Signatures

    self.signTransfer = function(transfer, privateKey){
      var data = self.buildTransferSignatureData(transfer);
      return self.buildSignature(data, privateKey);
    };

    self.buildTransferSignatureData = function(transfer) {
      return [].concat(
        self.getAssetTransferTxTypeBytes(),
        self.getPublicKeyBytes(transfer.senderPublicKey),
        self.getAssetIdBytes(transfer.assetId),
        self.getFeeAssetIdBytes(transfer.feeAssetId),
        self.getTimestampBytes(transfer.timestamp),
        self.getAmountBytes(transfer.amount),
        self.getFeeBytes(transfer.fee),
        self.getRecipientBytes(transfer.recipient),
        self.getStringAttachmentBytes(transfer.attachment)
      );
    };

    self.signSponsorship = function(sponsor, privateKey){
      var data = self.buildSponsorshipSignatureData(sponsor);
      console.log('Length: ', data.length);
      console.log('Data: ', data);
      return self.buildSignature(data, privateKey);
    };

    self.buildSponsorshipSignatureData = function(sponsor){
      var ty = self.getAssetSponsorshipTxTypeBytes();
      var ve = [sponsor.version];
      var pk = self.getPublicKeyBytes(sponsor.senderPublicKey);
      var ai = self.getAssetIdBytes(sponsor.assetId, true);
      var sf = self.getFeeBytes(sponsor.minSponsoredAssetFee);
      var fe = self.getFeeBytes(sponsor.fee);
      var tm = self.getTimestampBytes(sponsor.timestamp);

      console.log('Type: ', ty.length, ' ', ty);
      console.log('Version: ', ve.length, ' ', ve);
      console.log('PubKey: ', pk.length, ' ', pk);
      console.log('AssetId: ', ai.length, ' ', ai);
      console.log('SpFee: ', sf.length, ' ', sf);
      console.log('Fee: ', fe.length, ' ', fe);
      console.log('Time: ', tm.length, ' ', tm);

      return [].concat(
        ty, //14
        ve, //1
        pk, //45
        ai,
        sf, //45
        fe,
        tm
      );
    };

    self.buildSignature = function(bytes, privateKey) {
      var privateKeyBytes = self.getPrivateKeyBytes(privateKey);
      return cryptoService.nonDeterministicSign(privateKeyBytes, bytes);
    };

  }

  SignService.$inject = ['constants.transactions', 'constants.features', 'cryptoService', 'utilityService'];

  angular
    .module('walletApp')
    .service('signService', SignService);
})();
