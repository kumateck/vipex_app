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
