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
