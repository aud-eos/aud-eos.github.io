# DNS for audeos.com via Route 53.
#
# Hosted zone existed before the original Cloudflare migration and was
# preserved in R53 during the Cloudflare era. This file re-adopts it
# under tofu with no changes to live records (Phase 1 of the
# audeos.com extraction + R53 cutover, see
# docs/superpowers/specs/2026-05-10-audeos-com-extraction-and-route53-cutover-design.md
# in the audeos.fm repo).

resource "aws_route53_zone" "audeos_com" {
  name = "audeos.com"
}

import {
  to = aws_route53_zone.audeos_com
  id = "Z04082853V3NSCPIUKILC"
}

# === GitHub Pages — apex A records (single RRSet, 4 IPs) ===
# https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
# All four IPs are required; GH Pages serves from any of them.

resource "aws_route53_record" "apex_a" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "audeos.com"
  type    = "A"
  ttl     = 300
  records = [
    "185.199.108.153",
    "185.199.109.153",
    "185.199.110.153",
    "185.199.111.153",
  ]
}

import {
  to = aws_route53_record.apex_a
  id = "Z04082853V3NSCPIUKILC_audeos.com_A"
}

# === GitHub Pages — www subdomain ===

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "www.audeos.com"
  type    = "CNAME"
  ttl     = 300
  records = ["aud-eos.github.io"]
}

import {
  to = aws_route53_record.www
  id = "Z04082853V3NSCPIUKILC_www.audeos.com_CNAME"
}

# === ProtonMail — inbound mail ===
# Two MX records (primary 10 / secondary 20) as a single RRSet.

resource "aws_route53_record" "proton_mx" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "audeos.com"
  type    = "MX"
  ttl     = 300
  records = [
    "10 mail.protonmail.ch",
    "20 mailsec.protonmail.ch",
  ]
}

import {
  to = aws_route53_record.proton_mx
  id = "Z04082853V3NSCPIUKILC_audeos.com_MX"
}

# Apex TXT carries BOTH the Proton SPF and the Proton domain-verification
# token. R53 treats multiple TXT values at the same name as one RRSet.

resource "aws_route53_record" "apex_txt" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "audeos.com"
  type    = "TXT"
  ttl     = 300
  # AWS provider stores TXT values unquoted in HCL; the provider adds
  # the wire-level quoting itself. Order matches what's currently in
  # R53 to keep imports drift-free.
  records = [
    "protonmail-verification=c5dc9678c3fb9d0aa648269749dd74abe49fea3c",
    "v=spf1 include:_spf.protonmail.ch mx ~all",
  ]
}

import {
  to = aws_route53_record.apex_txt
  id = "Z04082853V3NSCPIUKILC_audeos.com_TXT"
}

# === ProtonMail — DKIM ===
# Three rotating selectors Proton issues per domain.

resource "aws_route53_record" "proton_dkim_1" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "protonmail._domainkey.audeos.com"
  type    = "CNAME"
  ttl     = 300
  records = ["protonmail.domainkey.dsok63rccxglsplvzwk27ssmbba5a5u34tbf4ub5tvacdeyzqoula.domains.proton.ch."]
}

import {
  to = aws_route53_record.proton_dkim_1
  id = "Z04082853V3NSCPIUKILC_protonmail._domainkey.audeos.com_CNAME"
}

resource "aws_route53_record" "proton_dkim_2" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "protonmail2._domainkey.audeos.com"
  type    = "CNAME"
  ttl     = 300
  records = ["protonmail2.domainkey.dsok63rccxglsplvzwk27ssmbba5a5u34tbf4ub5tvacdeyzqoula.domains.proton.ch."]
}

import {
  to = aws_route53_record.proton_dkim_2
  id = "Z04082853V3NSCPIUKILC_protonmail2._domainkey.audeos.com_CNAME"
}

resource "aws_route53_record" "proton_dkim_3" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "protonmail3._domainkey.audeos.com"
  type    = "CNAME"
  ttl     = 300
  records = ["protonmail3.domainkey.dsok63rccxglsplvzwk27ssmbba5a5u34tbf4ub5tvacdeyzqoula.domains.proton.ch."]
}

import {
  to = aws_route53_record.proton_dkim_3
  id = "Z04082853V3NSCPIUKILC_protonmail3._domainkey.audeos.com_CNAME"
}

# === DMARC — observation-mode policy on audeos.com ===

resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "_dmarc.audeos.com"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=quarantine"]
}

import {
  to = aws_route53_record.dmarc
  id = "Z04082853V3NSCPIUKILC__dmarc.audeos.com_TXT"
}

# === GitHub verification tokens ===
# Domain-verification challenges issued by GitHub. Removing either
# breaks the corresponding GitHub feature (org-verified domain badge,
# Pages custom-domain enforcement).

resource "aws_route53_record" "github_org_verification" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "_gh-aud-eos-o.audeos.com"
  type    = "TXT"
  ttl     = 300
  records = ["4f0fd67d98"]
}

import {
  to = aws_route53_record.github_org_verification
  id = "Z04082853V3NSCPIUKILC__gh-aud-eos-o.audeos.com_TXT"
}

resource "aws_route53_record" "github_pages_verification" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "_github-pages-challenge-aud-eos.audeos.com"
  type    = "TXT"
  ttl     = 300
  records = ["7f75747cd2e72f93a5a829efee1c7b"]
}

import {
  to = aws_route53_record.github_pages_verification
  id = "Z04082853V3NSCPIUKILC__github-pages-challenge-aud-eos.audeos.com_TXT"
}

# === Amazon SES — outbound mail via the mail.audeos.com subdomain ===
# Bounce/complaint MX + SPF for the subdomain. SES DKIM CNAMEs are in
# ses.tf because they depend on aws_ses_domain_identity.audeos_com
# (added in PR B).

resource "aws_route53_record" "mail_mx_ses" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "mail.audeos.com"
  type    = "MX"
  ttl     = 300
  records = ["10 feedback-smtp.us-east-1.amazonses.com"]
}

import {
  to = aws_route53_record.mail_mx_ses
  id = "Z04082853V3NSCPIUKILC_mail.audeos.com_MX"
}

resource "aws_route53_record" "mail_spf_ses" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "mail.audeos.com"
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]
}

# === Stale play.audeos.com — Phase 5 cleanup ===
# Adopted via import here purely so they can be destroyed via tofu in
# the next PR. Originally pointed at a previous deployment (probably a
# Vultr or similar host); intentionally removed from CF in audeos.fm
# PR #249 but never deleted from R53 (which was dormant at the time).
# Removed entirely in the follow-up PR.

resource "aws_route53_record" "play_a" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "play.audeos.com"
  type    = "A"
  ttl     = 300
  records = ["149.248.214.157"]
}

import {
  to = aws_route53_record.play_a
  id = "Z04082853V3NSCPIUKILC_play.audeos.com_A"
}

resource "aws_route53_record" "play_aaaa" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "play.audeos.com"
  type    = "AAAA"
  ttl     = 300
  records = ["2a09:8280:1::10b:b583:0"]
}

import {
  to = aws_route53_record.play_aaaa
  id = "Z04082853V3NSCPIUKILC_play.audeos.com_AAAA"
}

import {
  to = aws_route53_record.mail_spf_ses
  id = "Z04082853V3NSCPIUKILC_mail.audeos.com_TXT"
}
