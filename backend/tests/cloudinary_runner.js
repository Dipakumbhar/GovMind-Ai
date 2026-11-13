const assert = require('node:assert/strict');
const { uploadImage, MAX_IMAGE_BYTES, providerFailureReason } = require('../services/cloudinary');

const originalEnv = {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER,
};
const originalFetch = global.fetch;
let total = 0;
let passed = 0;

async function test(name, fn) {
  total += 1;
  try {
    await fn();
    passed += 1;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (error) {
    console.error(`  ❌ [FAIL] ${name}: ${error.message}`);
    throw error;
  }
}

function configureCloudinary() {
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  process.env.CLOUDINARY_FOLDER = 'test/complaints';
}

function imageFixture(type) {
  if (type === 'image/jpeg') return Buffer.from([0xff, 0xd8, 0xff, 0x00]);
  if (type === 'image/png') return Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  return Buffer.from('RIFF0000WEBP', 'ascii');
}

async function run() {
  console.log('\n🧪 Cloudinary upload validation (mocked Cloudinary HTTP API)');
  configureCloudinary();

  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    await test(`accepts a valid ${type} image and returns Cloudinary metadata`, async () => {
      global.fetch = async (_url, options) => {
        assert.equal(options.method, 'POST');
        assert.ok(options.body instanceof FormData);
        assert.equal(options.body.get('folder'), 'test/complaints');
        assert.equal(options.headers.Authorization, `Basic ${Buffer.from('test-key:test-secret').toString('base64')}`);
        assert.equal(options.body.has('api_key'), false);
        assert.equal(options.body.has('signature'), false);
        return { ok: true, json: async () => ({ secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg', public_id: 'test/complaint-image' }) };
      };
      const result = await uploadImage({ buffer: imageFixture(type), contentType: type, filename: 'evidence' });
      assert.equal(result.type, type);
      assert.equal(result.url, 'https://res.cloudinary.com/test/image/upload/test.jpg');
      assert.equal(result.publicId, 'test/complaint-image');
    });
  }

  await test('rejects a declared image type that does not match file bytes', async () => {
    let requested = false;
    global.fetch = async () => { requested = true; throw new Error('unexpected request'); };
    await assert.rejects(
      uploadImage({ buffer: imageFixture('image/png'), contentType: 'image/jpeg', filename: 'bad' }),
      { status: 400 }
    );
    assert.equal(requested, false);
  });

  await test('rejects images above the configured 5 MB limit before upload', async () => {
    let requested = false;
    global.fetch = async () => { requested = true; throw new Error('unexpected request'); };
    await assert.rejects(
      uploadImage({ buffer: Buffer.alloc(MAX_IMAGE_BYTES + 1), contentType: 'image/jpeg', filename: 'large' }),
      { status: 400 }
    );
    assert.equal(requested, false);
  });

  await test('reports missing Cloudinary configuration as a service-unavailable error', async () => {
    delete process.env.CLOUDINARY_API_SECRET;
    await assert.rejects(
      uploadImage({ buffer: imageFixture('image/jpeg'), contentType: 'image/jpeg', filename: 'test' }),
      { status: 503 }
    );
    configureCloudinary();
  });

  await test('maps a Cloudinary rejection to a retry-safe error without provider details', async () => {
    global.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Invalid Signature: private provider detail' } }) });
    await assert.rejects(
      uploadImage({ buffer: imageFixture('image/jpeg'), contentType: 'image/jpeg', filename: 'test' }),
      (error) => error.status === 502 && error.code === 'IMAGE_STORAGE_PROVIDER_REJECTED'
        && !error.message.includes('private provider detail')
    );
  });

  await test('reports a sanitized credential rejection code and request ID', async () => {
    global.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'api_secret mismatch' } }) });
    await assert.rejects(
      uploadImage({ buffer: imageFixture('image/jpeg'), contentType: 'image/jpeg', filename: 'test', requestId: 'upload-test-id' }),
      (error) => error.status === 502 && error.code === 'IMAGE_STORAGE_CREDENTIALS_REJECTED'
        && !error.message.includes('api_secret')
    );
  });

  await test('classifies provider authentication failures without returning provider text', async () => {
    assert.equal(providerFailureReason(401, 'Invalid Signature: private detail'), 'signature_rejected');
    assert.equal(providerFailureReason(401, 'Invalid API key: private detail'), 'api_key_mismatch');
    assert.equal(providerFailureReason(401, 'api_secret mismatch'), 'api_secret_mismatch');
    assert.equal(providerFailureReason(401, 'API key mismatch'), 'api_key_mismatch');
    assert.equal(providerFailureReason(401, 'private detail'), 'authentication_rejected');
  });

  console.log(`📊 Cloudinary mock suite: ${passed}/${total} passed. No external Cloudinary upload was performed.`);
}

run()
  .catch(() => { process.exitCode = 1; })
  .finally(() => {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
