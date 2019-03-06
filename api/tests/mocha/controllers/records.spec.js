const controller = require('../../../src/controllers/records'),
      chai = require('chai'),
      db = require('../../../src/db'),
      auth = require('../../../src/auth'),
      recordUtils = require('../../../src/controllers/record-utils'),
      sinon = require('sinon'),
      config = require('../../../src/config');

describe('records controller', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('create calls createRecordByJSON if json type', () => {
    sinon.stub(auth, 'check').resolves();
    const reqIs = sinon.stub().returns(false);
    reqIs.withArgs('json').returns('json'); // yes, it actually returns 'json'
    const createRecordByJSON = sinon.stub(recordUtils, 'createRecordByJSON').returns({ message: 'one' });
    const createByForm = sinon.stub(recordUtils, 'createByForm');
    const post = sinon.stub(db.medic, 'post').returns(Promise.resolve({ ok: true, id: 'xyz' }));
    const json = sinon.stub();
    const req = {
      body: {
        message: 'test',
        from: '+123'
      },
      is: reqIs
    };
    const res = { json: json };

    const transitionsLib = { processDocs: sinon.stub()};
    sinon.stub(config, 'getTransitionsLib').returns(transitionsLib);
    transitionsLib.processDocs.callsFake(docs => {
      const copy = JSON.parse(JSON.stringify(docs));
      copy.forEach(doc => doc.transitioned = true);
      return Promise.resolve(copy);
    });

    return controller.v2(req, res).then(() => {
      chai.expect(json.callCount).to.equal(1);
      chai.expect(json.args[0][0]).to.deep.equal({ success: true, id: 'xyz' });
      chai.expect(createRecordByJSON.callCount).to.equal(1);
      chai.expect(createRecordByJSON.args[0][0]).to.deep.equal(req.body);
      chai.expect(createByForm.callCount).to.equal(0);
      chai.expect(post.callCount).to.equal(1);
      chai.expect(post.args[0][0]).to.deep.equal({ message: 'one', transitioned: true });
      chai.expect(transitionsLib.processDocs.callCount).to.equal(1);
      chai.expect(transitionsLib.processDocs.args[0]).to.deep.equal([[{ message: 'one' }]]);
    });
  });

  it('create calls createByForm if urlencoded type', () => {
    sinon.stub(auth, 'check').resolves();
    const reqIs = sinon.stub().returns(false);
    reqIs.withArgs('urlencoded').returns('urlencoded');
    const createRecordByJSON = sinon.stub(recordUtils, 'createRecordByJSON');
    const createByForm = sinon.stub(recordUtils, 'createByForm').returns({ message: 'one' });
    const post = sinon.stub(db.medic, 'post').returns(Promise.resolve({ ok: true, id: 'zyx' }));
    const json = sinon.stub();
    const req = {
      body: {
        message: 'test',
        from: '+123'
      },
      is: reqIs
    };
    const res = { json: json };
    const transitionsLib = { processDocs: sinon.stub()};
    sinon.stub(config, 'getTransitionsLib').returns(transitionsLib);
    transitionsLib.processDocs.callsFake(docs => {
      const copy = JSON.parse(JSON.stringify(docs));
      copy.forEach(doc => doc.transitioned = true);
      return Promise.resolve(copy);
    });

    return controller.v2(req, res).then(() => {
      chai.expect(json.callCount).to.equal(1);
      chai.expect(json.args[0][0]).to.deep.equal({ success: true, id: 'zyx' });
      chai.expect(createRecordByJSON.callCount).to.equal(0);
      chai.expect(createByForm.callCount).to.equal(1);
      chai.expect(createByForm.args[0][0]).to.deep.equal(req.body);
      chai.expect(post.callCount).to.equal(1);
      chai.expect(post.args[0][0]).to.deep.equal({ message: 'one', transitioned: true });
      chai.expect(transitionsLib.processDocs.callCount).to.equal(1);
      chai.expect(transitionsLib.processDocs.args[0]).to.deep.equal([[{ message: 'one' }]]);
    });
  });

});
