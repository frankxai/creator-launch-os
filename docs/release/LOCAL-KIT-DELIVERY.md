# Private kit delivery rehearsal

The test merchant can return the physical commercial-kit ZIP while the server holds a valid entitlement in memory. Run from the source repository in a single local Next process. The packaged free template excludes the commercial sources. A hosted merchant, durable order store, customer delivery and production approval remain separate gates.

1. From a clean checkout run `node scripts/package-kit.mjs`. Keep its receipt and artifact under the generated `dist/kit` directory, outside the public directory.
2. In a temporary local shell set `COMMERCE_MODE=test`, `COMMERCE_MERCHANT=fixture` and independently generated secrets for `COMMERCE_WEBHOOK_SECRET` and `COMMERCE_DELIVERY_SECRET`. Use at least 32 characters each. Set `COMMERCE_TEST_KIT_REVISION` and `COMMERCE_TEST_KIT_SHA256` from the trusted receipt. The pinned facts belong on the server.
3. Start the app on loopback and run `node scripts/commerce-rehearsal.mjs http://127.0.0.1:3000` from the same configured environment. The rehearsal checks a paid fixture, replay, metadata, actual ZIP digest, refund, revoked download and an invalid signature. Restart the test process for a fresh fixture order.
4. Retain the printed status and digest as internal proof. Redact delivery tokens and query strings from logs. Signed URLs grant temporary bearer access. The process-local store resets on restart; production and live mode refuse this file path.

A missing or changed kit returns 503. An inactive grant returns 410 after refund. The route verifies the grant again after asynchronous file I/O. This local rehearsal exercises artifact access; a real merchant sandbox transaction and independent customer acceptance remain outstanding.
