# Creator Launch OS — product contract

Creator Launch OS is a public, zero-secret starter for independent creators who need to publish and operate a small catalog of digital products.

## The user story

A visitor discovers a release, understands the format and outcome, inspects exactly what is included, and reaches either a configured hosted checkout or an explicit no-payment demo. The creator can open `/studio` to see the operational shape behind the storefront.

## Free-template boundary

The free template includes:

- Public storefront and catalog
- Search and format filters
- Product detail routes with static generation
- Honest checkout fallback when no provider is configured
- Sample release studio with clearly labeled demo metrics
- Metadata, sitemap, robots, Open Graph image, health endpoint, loading, error, empty, and not-found states
- Environment-variable contract and one-click Vercel deployment metadata

It intentionally does not pretend to include:

- Payment-provider API calls
- Entitlement or secure-download storage
- Authentication
- Customer records
- Email automation
- Analytics events

Those are provider-specific production concerns. A commercial extension may add them, but the free repository remains useful without fabricated wiring.

## Activation event

The eventual product activation event is `delivery_opened`: a paying customer reached the promised file or feed. Page views and checkout clicks are supporting signals, not activation.

## Release states

| State | Meaning |
| --- | --- |
| `concept` | Product brief only |
| `interactive-demo` | UI can be explored but has no public source/deploy receipt |
| `remixable` | Public v0 source or chat is available |
| `deployable-free-template` | Public repository, zero-secret path, documented setup, and verified deployment |
| `commercial-kit` | Provider integrations and a defined support/license contract are included |

The manifest must not advance to a higher state without its verification receipt.
