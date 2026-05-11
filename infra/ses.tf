# SES for the audeos.com sender identity (org-root AWS account).
#
# Phase 2 of the audeos.com extraction (target half — see
# docs/superpowers/specs/2026-05-10-audeos-com-extraction-and-route53-cutover-design.md
# in the audeos.fm repo). The SES identity, the configuration set, the
# SNS topic + subscription, and the suppression/feedback attributes all
# existed in audeos.fm's tofu state under the `aws.root` provider alias;
# they're being state-moved here via `removed { destroy = false }` blocks
# in audeos.fm + `import {}` blocks below.
#
# The SNS subscription's endpoint (https://audeos.fm/webhooks/aws/sns/ses)
# is intentional cross-venture coupling: audeos.com has no backend, so
# both senders' bounce/complaint events fan out to the audeos.fm Phoenix
# app, whose SnsController already discriminates on `source_aws_account`.

resource "aws_ses_domain_identity" "audeos_com" {
  domain = "audeos.com"

  lifecycle {
    prevent_destroy = true
  }
}

import {
  to = aws_ses_domain_identity.audeos_com
  id = "audeos.com"
}

resource "aws_ses_domain_dkim" "audeos_com" {
  domain = aws_ses_domain_identity.audeos_com.domain
}

import {
  to = aws_ses_domain_dkim.audeos_com
  id = "audeos.com"
}

# SES DKIM CNAMEs — three rotating selectors AWS generates per domain.
# Resource _1 binds dkim_tokens[0], _2 binds [1], _3 binds [2]; the
# import IDs hard-code the actual current token values so the imports
# match drift-free regardless of array iteration order. If AWS rotates
# these tokens, the import IDs need to be re-fetched via
# `aws ses get-identity-dkim-attributes --identities audeos.com` and
# this file updated accordingly.

resource "aws_route53_record" "ses_dkim_1" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "${aws_ses_domain_dkim.audeos_com.dkim_tokens[0]}._domainkey.audeos.com"
  type    = "CNAME"
  ttl     = 300
  records = ["${aws_ses_domain_dkim.audeos_com.dkim_tokens[0]}.dkim.amazonses.com"]
}

import {
  to = aws_route53_record.ses_dkim_1
  id = "Z04082853V3NSCPIUKILC_vx62suc7wkuvjksulz3ih26quxbe54x6._domainkey.audeos.com_CNAME"
}

resource "aws_route53_record" "ses_dkim_2" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "${aws_ses_domain_dkim.audeos_com.dkim_tokens[1]}._domainkey.audeos.com"
  type    = "CNAME"
  ttl     = 300
  records = ["${aws_ses_domain_dkim.audeos_com.dkim_tokens[1]}.dkim.amazonses.com"]
}

import {
  to = aws_route53_record.ses_dkim_2
  id = "Z04082853V3NSCPIUKILC_sogkg7sttyheuho3jj6avbkjodbat3tu._domainkey.audeos.com_CNAME"
}

resource "aws_route53_record" "ses_dkim_3" {
  zone_id = aws_route53_zone.audeos_com.zone_id
  name    = "${aws_ses_domain_dkim.audeos_com.dkim_tokens[2]}._domainkey.audeos.com"
  type    = "CNAME"
  ttl     = 300
  records = ["${aws_ses_domain_dkim.audeos_com.dkim_tokens[2]}.dkim.amazonses.com"]
}

import {
  to = aws_route53_record.ses_dkim_3
  id = "Z04082853V3NSCPIUKILC_sctlukexy726mb3rwblll7wvxltdshdo._domainkey.audeos.com_CNAME"
}

# ---------- SES configuration set + SNS event fan-out ----------

resource "aws_sesv2_configuration_set" "audeos_default" {
  configuration_set_name = "audeos-default"

  delivery_options {
    tls_policy = "REQUIRE"
  }
}

import {
  to = aws_sesv2_configuration_set.audeos_default
  id = "audeos-default"
}

resource "aws_sns_topic" "audeos_ses_events" {
  name = "audeos-ses-events"
}

import {
  to = aws_sns_topic.audeos_ses_events
  id = "arn:aws:sns:us-east-1:037659517213:audeos-ses-events"
}

resource "aws_sns_topic_policy" "audeos_ses_events" {
  arn = aws_sns_topic.audeos_ses_events.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowSESPublish"
      Effect    = "Allow"
      Principal = { Service = "ses.amazonaws.com" }
      Action    = "SNS:Publish"
      Resource  = aws_sns_topic.audeos_ses_events.arn
    }]
  })
}

import {
  to = aws_sns_topic_policy.audeos_ses_events
  id = "arn:aws:sns:us-east-1:037659517213:audeos-ses-events"
}

resource "aws_sesv2_configuration_set_event_destination" "audeos_sns" {
  configuration_set_name = aws_sesv2_configuration_set.audeos_default.configuration_set_name
  event_destination_name = "audeos-sns"

  event_destination {
    enabled              = true
    matching_event_types = ["BOUNCE", "COMPLAINT"]

    sns_destination {
      topic_arn = aws_sns_topic.audeos_ses_events.arn
    }
  }
}

import {
  to = aws_sesv2_configuration_set_event_destination.audeos_sns
  id = "audeos-default|audeos-sns"
}

resource "aws_sns_topic_subscription" "audeos_webhook" {
  topic_arn              = aws_sns_topic.audeos_ses_events.arn
  protocol               = "https"
  endpoint               = "https://audeos.fm/webhooks/aws/sns/ses"
  endpoint_auto_confirms = true
}

import {
  to = aws_sns_topic_subscription.audeos_webhook
  id = "arn:aws:sns:us-east-1:037659517213:audeos-ses-events:c98a06b7-ea5d-46a7-8652-713277815a29"
}

# ---------- Account-level SES safety nets ----------

resource "aws_sesv2_account_suppression_attributes" "audeos" {
  suppressed_reasons = ["BOUNCE", "COMPLAINT"]
}

import {
  to = aws_sesv2_account_suppression_attributes.audeos
  id = "037659517213"
}

resource "aws_sesv2_email_identity_feedback_attributes" "audeos_com" {
  email_identity           = "audeos.com"
  email_forwarding_enabled = false
}

import {
  to = aws_sesv2_email_identity_feedback_attributes.audeos_com
  id = "audeos.com"
}
