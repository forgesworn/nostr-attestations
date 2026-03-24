# Pulse: Nostr Community NIPs — 24 March 2026

## TL;DR
No new competing attestation/trust community NIPs appeared on NostrHub in the last 36 hours — the only new NIP specs are ours (28 proposals published). The WoT-a-thon hackathon final submissions are due April 15, creating a time-sensitive opportunity to position our attestation stack. pablof7z is building AI SDK context management tooling, signalling core Nostr devs moving into the AI agent space — directly relevant to our MCP and agent commerce work.

## Action Items

### Today
- **Prepare for Nathan Day conversation.** Community NIP comparison sections are now in all overlapping specs. Key talking point: composability, not competition. Our NIP-VA now references all four competing proposals.
- **Review NIP-58 badge restructuring PR (#2276).** alexgleason proposes moving Profile Badges to kind 10008 and adding kind 30008 Badge sets. This changes the NIP-58 landscape we compare against in NIP-VA's motivation section — verify our comparison text is still accurate.

### This Week
- **Submit to WoT-a-thon.** Final deadline is April 15. Our attestation stack (NIP-VA + NIP-CREDENTIALS + NIP-TRUST + NIP-REPUTATION + reference implementation) is a strong submission for a trust-layer hackathon. Register at formstr.app and prepare a 5-minute demo video.
- **Monitor NIP-AA (Autonomous Agents) PR #2259.** Defines agents as first-class Nostr participants with TEE-based attestation. Overlaps with our attestation domain — agents that need verifiable credentials could use NIP-VA.
- **Track pablof7z's ai-sdk-context-management.** If a core NIP reviewer is building AI SDK tooling, he'll have opinions on agent-facing Nostr protocols. This could be an ally or a critic for our MCP-related NIPs.

## Headlines
- **Our 28 NIP specs are now live on NostrHub** — largest single-author batch of community NIPs in the window. No competing attestation/trust proposals appeared.
- **WoT-a-thon final submissions due April 15** — six-month Web of Trust hackathon entering final stretch. Attestation tooling is squarely in scope.
- **fiatjaf pushed "add scroll kind" to registry-of-kinds** — the kind registry is actively maintained; new kinds are being registered.
- **NIP-58 (Badges) restructuring proposed** — PR #2276 changes badge kinds, directly affecting our NIP-VA comparison narrative.
- **NIP-AA (Autonomous Agents) PR #2259 gaining attention** — TEE-based agent attestation on Nostr, overlapping with our credential space.
- **pablof7z heavily pushing AI SDK context management** — core reviewer building TypeScript AI middleware, signalling agent-commerce convergence.
- **Nathan Day and mstrofnone both quiet** — no Nostr posts or NostrHub updates from either watched attestation author in the window.

## Releases & Launches
- **registry-of-kinds** — fiatjaf added "scroll" kind (`66bd3e1d`, 2026-03-24). Shows the kind registry is active and monitored. [ECOSYSTEM-SIGNAL]

## Protocol Movement
- **NIP-50: sort extensions** — PR #2283 by alexgleason adds `sort:top`, `sort:hot`, `sort:zapped`, `sort:new` to search. Quality-of-life improvement for relay search. [ECOSYSTEM-SIGNAL]
- **NIP-58: badge restructuring** — PR #2276 by alexgleason moves Profile Badges to kind 10008, adds kind 30008 Badge sets. Badges are a frequent comparison point in our NIP-VA motivation section. [OVERLAP-ALERT]
- **NIP-AA: Autonomous Agents** — PR #2259 by nandubatchu. Defines autonomous agents with TEE attestation, Bitcoin/Cashu integration, and verifiable identity. No reviewer comments yet. [OVERLAP-ALERT] [COLLABORATION-OPPORTUNITY]
- **NIP-11/NIP-66: "attributes" field** — PR #2257 by hzrd149. Adds structured attributes to relay info documents. [ECOSYSTEM-SIGNAL]
- **Static Websites** — PR #1538 (hzrd149) and PR #2282 (arthurfranca) both active. Competing approaches to Nostr-hosted static sites. [ECOSYSTEM-SIGNAL]
- **NIP-CF "Combine Forces"** — PR #2277 by dskvr. Interoperable napps (Nostr apps). [ECOSYSTEM-SIGNAL]
- **window.nostr.peekPublicKey debate** — PR #2233 active discussion between fiatjaf, staab, and arthurfranca about auto-login semantics for 44b-served Nostr apps. [ECOSYSTEM-SIGNAL]

## Builder Activity
- **fiatjaf** — 20 events. Contributing to dtonon's fevela (innovative Nostr social client, 40 stars). Pushed to registry-of-kinds. Actively commenting on NIP PRs. Focus: client innovation + protocol governance.
- **staab** — 9 events. Pushing to coracle and welshman (Nostr client libraries). Commenting on NIP PRs (sceptical of peekPublicKey). Focus: client development.
- **pablof7z** — 20 events. Heavily pushing to `ai-sdk-context-management` — a TypeScript middleware for AI SDK v6 context window management. Brand new repo (created 2026-03-10, 0 stars). This signals pablof7z's attention is shifting toward AI agent tooling. [COLLABORATION-OPPORTUNITY]
- **vitorpamplona** — 20 events. Heavy Amethyst PR activity (5+ PRs in window). Focus: Android client development.
- **Nathan Day** — No activity in window. Last active: 2026-03-21 (responded to our NIP-VA announcement).
- **mstrofnone** — No activity in window.

## Moonshots & Signals
- **WoT-a-thon (Web of Trust Hackathon)** — Running Nov 2025 to April 2026, organised by nosfabrica. Final submissions due **April 15, 2026**. Includes post-hackathon mentorship and seed-grant pipeline (May-June 2026). Our attestation stack is a natural fit. Registration: formstr.app. Contact: hello@nosfabrica.com. [COLLABORATION-OPPORTUNITY]
- **NIP-AA implies agent attestation needs** — If autonomous agents become first-class Nostr participants, they need verifiable credentials (operator identity, TEE attestation, capability declarations). NIP-VA could serve as the credential layer for NIP-AA agents. [OVERLAP-ALERT] [COLLABORATION-OPPORTUNITY]
- **Nostr WoT toolkit** — nostr-wot.com provides browser extension and oracle API for trust-based filtering. They're implementing client-side WoT queries — a potential consumer of NIP-VA attestation data. [ECOSYSTEM-SIGNAL]

## What This Means For Us

The attestation landscape on Nostr is stabilising rather than fragmenting. No new competing proposals appeared in this window, and our 28 NIP publications are now the largest single-author contribution on NostrHub. The comparison sections we added today put us in a strong position for the Nathan Day conversation — we can demonstrate that we've done our homework on existing community NIPs.

The WoT-a-thon deadline (April 15) is the most actionable finding. Our stack — NIP-VA reference implementation with 17 test vectors, NIP-CREDENTIALS for gating, NIP-TRUST for portable trust networks, NIP-REPUTATION for structured reviews — is exactly what a Web of Trust hackathon is looking for. The post-hackathon mentorship and seed-grant pipeline adds commercial value. This should be a priority this week.

pablof7z's move into AI SDK middleware is strategically significant. As a core NIP reviewer who pushes for minimal kinds, having him invested in AI agent tooling means he'll be more receptive to agent-facing protocol proposals — including our L402 and MCP-related NIPs. His `ai-sdk-context-management` repo could be a conversation starter.

The NIP-58 badge restructuring needs monitoring. Our NIP-VA motivation section explicitly compares against NIP-58's limitations. If badges get more sophisticated (badge sets, better kind organisation), we need to update our comparison to remain accurate.

## SWOT

### Strengths
| Strength | Our repo(s) | Detail |
|----------|-------------|--------|
| Largest community NIP portfolio | `nip-drafts`, `nostr-attestations` | 28 specs published, more than any other single author on NostrHub |
| Reference implementation exists | `nostr-attestations` | 17 frozen test vectors, builders/parsers/validators — competitors have specs only |
| Community NIP homework done | `nostr-attestations`, `nip-drafts` | All overlapping specs now reference existing community NIPs with comparison sections |

### Weaknesses
| Weakness | Our repo(s) | Detail |
|----------|-------------|--------|
| No client rendering NIP-VA | `nostr-attestations` | Nathan's kind 31871 has Nostria rendering; our kind 31000 has no client support yet |
| Volume may intimidate | `nip-drafts` | 28 NIPs from one author could trigger "platform-specific" pushback from reviewers |

### Opportunities
| Opportunity | Our repo(s) | Priority | Suggested action |
|-------------|-------------|----------|-----------------|
| WoT-a-thon submission | `nostr-attestations`, `nip-drafts` | High | Register and prepare demo by April 15 |
| NIP-AA agent credential layer | `nostr-attestations` | Med | Comment on PR #2259 showing how NIP-VA serves agent credential needs |
| pablof7z AI SDK convergence | `402-mcp`, `trott-mcp` | Med | Engage with his ai-sdk-context-management repo; demonstrate MCP/agent commerce fit |

### Threats
| Threat | Our repo(s) at risk | Severity | Detail |
|--------|-------------------|----------|--------|
| Nathan Day has client traction | `nostr-attestations` | Med | Kind 31871 rendered in Nostria; if more clients adopt, momentum shifts away from kind 31000 |
| NIP-58 badge improvements | `nostr-attestations` | Low | If badges gain expiration/revocation, the gap NIP-VA fills narrows |
| "Too many kinds" reviewer fatigue | `nip-drafts` | Med | 28 NIPs defining 40+ kinds will face scrutiny from fiatjaf's minimal-kinds philosophy |

## Source Links

| Item | Type | Link |
|------|------|------|
| NIP-AA: Autonomous Agents | PR | https://github.com/nostr-protocol/nips/pull/2259 |
| NIP-50: sort extensions | PR | https://github.com/nostr-protocol/nips/pull/2283 |
| NIP-58: badge restructuring | PR | https://github.com/nostr-protocol/nips/pull/2276 |
| NIP-11/66: attributes | PR | https://github.com/nostr-protocol/nips/pull/2257 |
| Static Websites | PR | https://github.com/nostr-protocol/nips/pull/1538 |
| NIP-CF Combine Forces | PR | https://github.com/nostr-protocol/nips/pull/2277 |
| peekPublicKey | PR | https://github.com/nostr-protocol/nips/pull/2233 |
| pablof7z ai-sdk-context-management | Repo | https://github.com/pablof7z/ai-sdk-context-management |
| fevela (Nostr social client) | Repo | https://github.com/dtonon/fevela |
| registry-of-kinds | Repo | https://github.com/nostr-protocol/registry-of-kinds |
| Nostr WoT toolkit | Site | https://nostr-wot.com/ |
| WoT-a-thon hackathon | Article | https://medium.com/nostr-wot/nostr-solved-censorship-now-lets-solve-trust-cc776bbd0f8f |
| WoT-a-thon registration | Form | https://formstr.app |
| NIP-85 Trusted Assertions PR | PR | https://github.com/nostr-protocol/nips/pull/1534 |

---
*Sources: nostr-protocol GitHub org events, nostr-protocol/nips PRs and commits, nostr-protocol/registry-of-kinds commits, individual developer GitHub activity (fiatjaf, staab, pablof7z, vitorpamplona), NostrHub kind 30817 events via nak, web search for WoT/attestation ecosystem*
*Window: 2026-03-23 00:00 NZDT to 2026-03-24 ~21:00 NZDT*
