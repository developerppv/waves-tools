(function() {
  'use strict';

  angular
    .module('walletApp')
    .service('cryptoService', ['constants.network', 'Curve25519', 'blake2b', 'Base58', 'converters', '$window', function(constants, Curve25519, blake2b, Base58, converters, window) {

      // private version of getNetworkId byte in order to avoid circular dependency
      // between cryptoService and utilityService
      var getNetworkIdByte = function() {
        return constants.NETWORK_CODE.charCodeAt(0) & 0xFF;
      };

      var appendUint8Arrays = function(array1, array2) {
        var tmp = new Uint8Array(array1.length + array2.length);
        tmp.set(array1, 0);
        tmp.set(array2, array1.length);
        return tmp;
      };

      var appendNonce = function(originalSeed) {
        // change this is when nonce increment gets introduced
        var nonce = new Uint8Array(converters.int32ToBytes(constants.INITIAL_NONCE, true));

        return appendUint8Arrays(nonce, originalSeed);
      };

      // sha256 accepts messageBytes as Uint8Array or Array
      var sha256 = function(message) {
        var bytes;
        if (typeof(message) == 'string')
          bytes = converters.stringToByteArray(message);
        else
          bytes = message;

        var wordArray = converters.byteArrayToWordArrayEx(new Uint8Array(bytes));
        var resultWordArray = CryptoJS.SHA256(wordArray);

        return converters.wordArrayToByteArrayEx(resultWordArray);
      };

      var prepareKey = function(key) {
        var rounds = 1000;
        var digest = key;
        for (var i = 0; i < rounds; i++) {
          digest = converters.byteArrayToHexString(sha256(digest));
        }

        return digest;
      };

      // blake2b 256 hash function
      this.blake2b = function(input) {
        return blake2b.compute(input, null, 32);
      };

      // keccak 256 hash algorithm
      this.keccak = function(messageBytes) {
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        return keccak_256.array(messageBytes);
        // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
      };

      this.sha256 = sha256;

      this.hashChain = function(noncedSecretPhraseBytes) {
        var bytes = new Uint8Array(noncedSecretPhraseBytes)
        var blHash = this.blake2b(bytes)
        var kcHash = this.keccak(blHash)

        return kcHash
      };

      // Base68 encoding/decoding implementation
      this.base58 = {
        encode: function(buffer) {
          return Base58.encode(buffer);
        },
        decode: function(string) {
          return Base58.decode(string);
        }
      };

      this.buildAccountSeedHash = function(seedBytes) {
        var data = appendNonce(seedBytes);
        var seedHash = this.hashChain(data);

        return sha256(Array.prototype.slice.call(seedHash));
      };

      this.buildKeyPair = function(seedBytes) {
        var accountSeedHash = this.buildAccountSeedHash(seedBytes);
        var p = Curve25519.generateKeyPair(accountSeedHash);

        var pri = this.base58.encode(p.private);
        var pub = this.base58.encode(p.public);

        return {
          public: this.base58.encode(p.public),
          private: this.base58.encode(p.private)
        };
      };

      this.buildPublicKey = function(seedBytes) {
        return this.buildKeyPair(seedBytes).public;
      };

      this.buildPrivateKey = function(seedBytes) {
        return this.buildKeyPair(seedBytes).private;
      };

      this.buildRawAddress = function(encodedPublicKey) {
        var publicKey = this.base58.decode(encodedPublicKey);
        var publicKeyHash = this.hashChain(publicKey);

        var prefix = new Uint8Array(2);
        prefix[0] = constants.ADDRESS_VERSION;
        prefix[1] = getNetworkIdByte();

        var unhashedAddress = appendUint8Arrays(prefix, publicKeyHash.slice(0, 20));
        var addressHash = this.hashChain(unhashedAddress).slice(0, 4);
        var finalAddress = this.base58.encode(appendUint8Arrays(unhashedAddress, addressHash));

        return finalAddress;
      };

      this.buildRawAddressFromSeed = function(secretPhrase) {
        var publicKey = this.getPublicKey(secretPhrase);
        return this.buildRawAddress(publicKey);
      };

      //Returns publicKey built from string
      this.getPublicKey = function(secretPhrase) {
        return this.buildPublicKey(converters.stringToByteArray(secretPhrase));
      };

      //Returns privateKey built from string
      this.getPrivateKey = function(secretPhrase) {
        return this.buildPrivateKey(converters.stringToByteArray(secretPhrase));
      };

      //Returns key pair built from string
      this.getKeyPair = function(secretPhrase) {
        return this.buildKeyPair(converters.stringToByteArray(secretPhrase));
      };

      // function accepts buffer with private key and an array with dataToSign
      // returns buffer with signed data
      // 64 randoms bytes are added to the signature
      // method falls back to deterministic signatures if crypto object is not supported
      this.nonDeterministicSign = function(privateKey, dataToSign) {
        var crypto = window.crypto || window.msCrypto;
        var random;
        if (crypto) {
          random = new Uint8Array(64);
          crypto.getRandomValues(random);
        }

        var signature = Curve25519.sign(privateKey, new Uint8Array(dataToSign), random);

        return this.base58.encode(signature);
      };

      // function accepts buffer with private key and an array with dataToSign
      // returns buffer with signed data
      this.deterministicSign = function(privateKey, dataToSign) {
        var signature = Curve25519.sign(privateKey, new Uint8Array(dataToSign));

        return this.base58.encode(signature);
      };

      this.verify = function(senderPublicKey, dataToSign, signatureBytes) {
        return Curve25519.verify(senderPublicKey, dataToSign, signatureBytes);
      };

      this.encryptWalletSeed = function(seed, key) {
        var aesKey = prepareKey(key);

        return CryptoJS.AES.encrypt(seed, aesKey);
      };

      this.decryptWalletSeed = function(cipher, key, checksum) {
        var aesKey = prepareKey(key);
        var data = CryptoJS.AES.decrypt(cipher, aesKey);

        var actualChecksum = this.seedChecksum(converters.hexStringToByteArray(data.toString()));
        if (actualChecksum === checksum)
          return converters.hexStringToString(data.toString());
        else
          return false;
      };

      this.seedChecksum = function(seed) {
        return converters.byteArrayToHexString(sha256(seed));
      };

    }]);
})();
