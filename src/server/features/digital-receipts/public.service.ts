import { NotFound } from '@/server/utils/http-error';
import { sha256HexAsync } from '@/server/utils/otp';
import { findCompanyModuleRepo } from '../company-modules/repository';
import { DIGITAL_RECEIPTS_MODULE_CODE } from './constants';
import { buildReceiptSvc } from './receipt-document.service';
import { renderReceiptHtml } from './render/render-receipt-html';
import { findReceiptShareLinkByTokenHashRepo, recordReceiptShareLinkViewRepo } from './repository';
import type { ReceiptKind } from '@/shared/digital-receipts/channels';

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const notFound = () => NotFound('Receipt not found or the link has expired');

/**
 * Public, unauthenticated: the token in the link is the only credential.
 * Unknown, expired, or module-disabled links all return the same 404.
 */
export async function getPublicReceiptSvc(token: string) {
  if (!TOKEN_PATTERN.test(token)) throw notFound();
  const link = await findReceiptShareLinkByTokenHashRepo(await sha256HexAsync(token));
  if (!link || link.expiresAt.getTime() <= Date.now()) throw notFound();

  const module = await findCompanyModuleRepo(link.companyId, DIGITAL_RECEIPTS_MODULE_CODE);
  if (!module?.isEnabled) throw notFound();

  let receipt;
  try {
    receipt = await buildReceiptSvc({
      companyId: link.companyId,
      parcelId: link.parcelId,
      kind: link.kind as ReceiptKind,
      issuedAt: link.createdAt,
    });
  } catch {
    throw notFound();
  }

  void recordReceiptShareLinkViewRepo(link.id).catch(() => undefined);
  return {
    kind: receipt.kind,
    bookingCode: receipt.bookingCode,
    issuedAt: receipt.issuedAt,
    summary: receipt.summary,
    html: renderReceiptHtml(receipt.document, `receipt-${receipt.bookingCode}`),
  };
}
