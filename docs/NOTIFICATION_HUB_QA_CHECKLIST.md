# Notification Hub QA Checklist

Date: 2026-03-31

## 1. Module Gating

- [ ] `notification_hub` disabled -> Notification Hub menu/routes are hidden.
- [ ] `notification_hub` disabled -> `/v1/notification-hub/*` returns forbidden/module-disabled error.
- [ ] `notification_hub` enabled -> menu/routes visible based on route permissions.

## 2. Provider Management

- [ ] Create SMS provider with `log_only` key.
- [ ] Create SMS provider with `custom_webhook` and valid URL config.
- [ ] Create Email provider entry and set as default.
- [ ] Set default provider on one row and verify previous default is unset for that channel.
- [ ] Deactivate provider and verify it cannot be used as default sender.

## 3. Template Management

- [ ] Create SMS template with placeholders (e.g., `{{recipientName}}`).
- [ ] Create Email template with subject + body.
- [ ] Deactivate a template and verify it no longer appears in template options.

## 4. Campaign Lifecycle

- [ ] Create campaign with template.
- [ ] Create campaign with body override only.
- [ ] Submit draft campaign.
- [ ] Approve submitted campaign.
- [ ] Reject submitted campaign with note.
- [ ] Send approved campaign.
- [ ] Verify sent campaign status becomes `Sent`.

## 5. Audience Resolution

- [ ] `customers_all` resolves customer contacts for chosen channel.
- [ ] `users_all` resolves user contacts for chosen channel.
- [ ] `employees_all` resolves employee contacts for chosen channel.
- [ ] `employees_birthday_today` resolves only today birthday matches.

## 6. Dispatch Logs and Retry

- [ ] Delivery rows are created in dispatch list for campaign sends.
- [ ] Failed dispatch includes error message.
- [ ] Retry failed dispatch updates attempts and status.

## 7. Call Center Parcel Status Integration

- [ ] Open Parcel Status -> Call Outcome dialog.
- [ ] Save outcome with SMS toggle on -> dispatch rows created.
- [ ] Save outcome with Email toggle on -> dispatch rows created.
- [ ] Enable second receiver and confirm second receiver receives selected channels.
- [ ] Failed call-center sends are visible in dispatch logs and retryable.
- [ ] Simulate mNotify HTTP 500 with an HTML/New Relic error page: the saved outcome remains,
      exactly one SMS request occurs, and the warning/log shows a readable HTTP 500 service
      error with guidance to check mNotify delivery reports before retrying; no HTML appears.
- [ ] Verify ordinary call-outcome SMS requests use JSON and `Accept: application/json`, with
      `is_schedule: false`, recipient array, and no OTP `sms_type` flag.
- [ ] Simulate SMS failure, email failure, and a failed email dispatch-record creation: the API
      returns matching failed counts and channel/recipient failure entries; API keys are redacted.
- [ ] Main receiver succeeds and second receiver fails: show both the successful count and the
      second receiver's failure reason. Full success returns an empty failure list.
- [ ] An older count-only API response still shows a warning with Dispatch Logs guidance; web
      and desktop display detailed warnings for ten seconds and do not repeat the outcome save.
- [ ] Mobile and bulk count-based notification feedback remains compatible with additive fields.

Automated coverage: `parcel-notifications.service.test.ts`, `mnotify-sms-provider.test.ts`, and
`call-outcome-notification-feedback.test.ts`. These use mocked provider responses and do not send
live customer messages.

### Resend a saved call outcome (web and desktop)

- [ ] Save pickup/delivery/follow-up with notifications off or a mocked provider failure. Enable
      **Include saved outcomes**, search by booking, and open **Resend Notification** on the saved row.
- [ ] Verify the saved outcome is read-only, SMS defaults on/email off, and the saved second
      receiver option appears only when present. Both channels off disables sending.
- [ ] Send SMS only, email only, and both channels, with/without the saved second receiver;
      confirm current saved recipients, event template, and per-channel failure diagnostics.
- [ ] Confirm each resend creates new dispatch history and `isResend: true` audit metadata;
      parcel status, call timestamp, assignment, receiver details, and payments remain unchanged.
- [ ] Double-click resend and try closing the dialog during a delayed request: one request is
      sent, controls remain disabled, and the dialog cannot close until it finishes.
- [ ] Success closes the dialog; provider rejection, transport errors, and zero contact addresses
      leave it open with a clear message. No automatic resend or outcome save occurs.
- [ ] Reassign/delete the parcel, change its outcome, clear its call marker, or progress delivery
      after opening the dialog: reject the stale send before contacting the provider (404/409).
- [ ] Check missing authentication, either permitted call-center grant, missing permission,
      disabled module, wrong company/branch, missing scope, no channels, and malformed input.
- [ ] Toggle saved outcomes after changing search/payment/page size: server pagination remains
      accurate, page resets to 1, selection clears, and contacted rows cannot enter bulk updates.
- [ ] Default calling queue and existing mobile call-save behavior remain unchanged. Check
      mNotify delivery reports before manually resending an unconfirmed HTTP 500 attempt.

Coverage: `saved-parcel-call-outcome.test.ts`, `parcel-call-resend.service.test.ts`,
`parcel-call-resend.routes.test.ts`, and `parcel-call-notification-resend-content.test.tsx`.

## 8. Permission Gates

- [ ] `CanReadNotificationHub` controls list pages.
- [ ] `CanManageNotificationProviders` controls provider create/update/default.
- [ ] `CanManageNotificationTemplates` controls template create/update.
- [ ] `CanCreateNotificationCampaigns` controls campaign create/submit.
- [ ] `CanApproveNotificationCampaigns` controls approvals.
- [ ] `CanSendNotificationCampaigns` controls send.
- [ ] `CanRetryNotificationMessages` controls retry.
- [ ] `CanSendCallCenterNotifications` or `CanReadCallCenterParcelStatus` allows call-center event send.

## 9. Regression Checks

- [ ] Parcel status save without notification toggles still works.
- [ ] Existing procurement/fleet/wallet/reconciliation pages still load.
- [ ] `bunx tsc --noEmit` passes.

## Location contact variables (2026-10-23)

- [ ] Apply `0089_location_telephone`; existing names/capabilities remain and telephone is null.
- [ ] Save a location telephone, including a leading-zero or international number; verify detail,
      list, options, and edit round-trip it. Blank/null clears; omitted PATCH preserves it.
- [ ] Edit an existing customized SMS event and bulk template; insert `{{locationName}}` and
      `{{locationPhone}}`, save, and verify both are accepted. Original bodies stay unchanged.
- [ ] In a mocked/log-only workflow, verify bulk SMS uses the sender's location; parcel call/OTP
      uses the parcel pickup location; queue uses its queue location. Branch phone must differ
      in the fixture and must not be substituted for locationPhone.
- [ ] With no location/telephone, verify empty output and no unresolved tokens. A deleted,
      foreign-company or wrong-branch location must not provide contact data.
- [ ] Verify digital receipts retain the legacy location label/address, while locationName and
      locationPhone show the assigned pickup contact; no pickup location yields empty new tokens.
- [ ] Check location create/edit and SMS variable buttons at desktop and narrow widths.
      Native mobile uses server SMS substitution and adds no administration screen.
- [ ] Run isolated integration test `SMS_LOCATION_TEST=1 TEST_DATABASE_URL=postgres://localhost/vipex_sms_location_test bun test tests/server/sms-location.spec.ts` on the named empty local DB only.
