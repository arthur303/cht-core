describe('DeleteDoc service', function() {

  'use strict';

  var service,
      get,
      put,
      broadcast,
      message;

  beforeEach(function() {
    get = sinon.stub();
    put = sinon.stub();
    broadcast = sinon.stub();
    message = {};
    module('inboxApp');
    module(function ($provide) {
      $provide.factory('DB', KarmaUtils.mockDB({ put: put, get: get }));
      $provide.factory('$rootScope', function() {
        return { $broadcast: broadcast };
      });
    });
    inject(function(_DeleteDoc_) {
      service = _DeleteDoc_;
    });
  });

  afterEach(function() {
    KarmaUtils.restore(get, put, broadcast);
  });

  it('returns db errors', function(done) {
    get.returns(KarmaUtils.fakeResolved('errcode1'));
    service('abc', function(err) {
      chai.expect(get.calledOnce).to.equal(true);
      chai.expect(get.firstCall.args[0]).to.equal('abc');
      chai.expect(err).to.equal('errcode1');
      done();
    });
  });

  it('returns audit errors', function(done) {
    get.returns(KarmaUtils.fakeResolved(null, { _id: 'xyz' }));
    put.returns(KarmaUtils.fakeResolved('errcode2'));
    service('abc', function(err) {
      chai.expect(get.calledOnce).to.equal(true);
      chai.expect(put.calledOnce).to.equal(true);
      chai.expect(err).to.equal('errcode2');
      done();
    });
  });

  it('marks the message deleted', function(done) {
    get.returns(KarmaUtils.fakeResolved(null, { _id: 'xyz', type: 'data_record' }));
    put.returns(KarmaUtils.fakeResolved());
    var expected = { _id: 'xyz', type: 'data_record', _deleted: true };
    service('abc', function(err, actual) {
      chai.expect(get.calledOnce).to.equal(true);
      chai.expect(put.calledOnce).to.equal(true);
      chai.expect(broadcast.calledOnce).to.equal(false);
      chai.expect(get.firstCall.args[0]).to.equal('abc');
      chai.expect(actual).to.deep.equal(expected);
      done();
    });
  });

  it('broadcasts event if clinic', function(done) {
    get.returns(KarmaUtils.fakeResolved(null, { _id: 'xyz', type: 'clinic' }));
    put.returns(KarmaUtils.fakeResolved());
    var expected = { _id: 'xyz', type: 'clinic', _deleted: true };
    service('abc', function(err, actual) {
      chai.expect(get.calledOnce).to.equal(true);
      chai.expect(put.calledOnce).to.equal(true);
      chai.expect(broadcast.calledOnce).to.equal(true);
      chai.expect(get.firstCall.args[0]).to.equal('abc');
      chai.expect(broadcast.firstCall.args[0]).to.equal('ContactUpdated');
      chai.expect(broadcast.firstCall.args[1]).to.deep.equal(expected);
      chai.expect(actual).to.deep.equal(expected);
      done();
    });
  });

  it('updates clinic deleted person is contact for', function(done) {
    var clinic = {
      _id: 'b',
      type: 'clinic',
      contact: {
        name: 'sally',
        phone: '+555'
      }
    };
    var person = {
      _id: 'a',
      type: 'person',
      phone: '+555',
      name: 'sally',
      parent: {
        _id: 'b'
      }
    };
    get
      .onFirstCall().returns(KarmaUtils.fakeResolved(null, person))
      .onSecondCall().returns(KarmaUtils.fakeResolved(null, clinic));
    put.returns(KarmaUtils.fakeResolved());
    service('a', function(err, actual) {
      chai.expect(get.calledTwice).to.equal(true);
      chai.expect(put.calledTwice).to.equal(true);
      chai.expect(broadcast.calledTwice).to.equal(true);
      chai.expect(get.firstCall.args[0]).to.equal('a');
      chai.expect(get.secondCall.args[0]).to.equal('b');
      chai.expect(put.firstCall.args[0].contact).to.equal(null);
      chai.expect(broadcast.firstCall.args[0]).to.equal('ContactUpdated');
      chai.expect(broadcast.firstCall.args[1]._id).to.equal('b');
      chai.expect(broadcast.secondCall.args[0]).to.equal('ContactUpdated');
      chai.expect(broadcast.secondCall.args[1]._id).to.equal('a');
      chai.expect(actual._deleted).to.equal(true);
      done();
    });
  });

  it('done update clinic when phone does not match', function(done) {
    var clinic = {
      _id: 'b',
      type: 'clinic',
      contact: {
        name: 'sally',
        phone: '+666'
      }
    };
    var person = {
      _id: 'a',
      type: 'person',
      phone: '+555',
      name: 'sally',
      parent: {
        _id: 'b'
      }
    };
    get
      .onFirstCall().returns(KarmaUtils.fakeResolved(null, person))
      .onSecondCall().returns(KarmaUtils.fakeResolved(null, clinic));
    put.returns(KarmaUtils.fakeResolved());
    service('a', function(err, actual) {
      chai.expect(get.calledTwice).to.equal(true);
      chai.expect(put.calledOnce).to.equal(true);
      chai.expect(broadcast.calledOnce).to.equal(true);
      chai.expect(get.firstCall.args[0]).to.equal('a');
      chai.expect(get.secondCall.args[0]).to.equal('b');
      chai.expect(actual._deleted).to.equal(true);
      done();
    });
  });

});
