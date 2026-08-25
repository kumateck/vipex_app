import { ThermalStickerLandscapeTemplate } from './thermal-sticker-landscape-template';
import { ThermalStickerPortraitTemplate } from './thermal-sticker-portrait-template';
import type { ThermalStickerTemplateProps } from './thermal-sticker-template-types';
import { formatTelephones } from './thermal-sticker-template-utils';

export function ThermalStickerTemplate(props: ThermalStickerTemplateProps) {
  const {
    bookingCode,
    issuedAtLabel,
    printedByName,
    printedByBranchName,
    printedByLocationName,
    parcelDetails,
    parcelContent,
    senderName,
    senderTelephone,
    senderTelephone2,
    receiverName,
    receiverTelephone,
    receiverTelephone2,
    destinationBranchName,
    destinationLocationName,
    toBePaidCedis,
    qrValue,
    formatMoney,
    orientation = 'portrait',
  } = props;
  const hasToBePaid = typeof toBePaidCedis === 'number' && toBePaidCedis > 0;
  const statusLabel = hasToBePaid ? 'TO BE PAID' : 'PAID';
  const statusAmountLabel = hasToBePaid ? formatMoney(toBePaidCedis) : undefined;
  const senderTelephones = formatTelephones(senderTelephone, senderTelephone2);
  const receiverTelephones = formatTelephones(receiverTelephone, receiverTelephone2);
  const templateProps = {
    bookingCode,
    issuedAtLabel,
    printedByName,
    printedByBranchName,
    printedByLocationName,
    senderName,
    senderTelephones,
    receiverName,
    receiverTelephones,
    destinationBranchName,
    destinationLocationName,
    parcelContent,
    parcelDetails,
    statusLabel,
    statusAmountLabel,
    hasToBePaid,
    qrValue,
  };

  if (orientation === 'portrait') {
    return <ThermalStickerPortraitTemplate {...templateProps} />;
  }

  return <ThermalStickerLandscapeTemplate {...templateProps} />;
}
