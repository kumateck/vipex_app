import { Alert, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { notifyError, notifySuccess } from '@mobile/lib/notify';

export function showQueueTicketDialog(input: {
  queueCode: string;
  shortMessage: string;
  fullMessage: string;
}) {
  const copyCode = () => {
    try {
      Clipboard.setString(input.queueCode);
      notifySuccess('Queue code copied.');
    } catch (error) {
      notifyError('Copy failed', error instanceof Error ? error.message : 'Unable to copy code');
    }
  };

  const share = async (message: string) => {
    try {
      await Share.share({ message });
    } catch (error) {
      notifyError(
        'Share failed',
        error instanceof Error ? error.message : 'Unable to share ticket',
      );
    }
  };

  Alert.alert('Queue ticket ready', `Queue code: ${input.queueCode}`, [
    { text: 'Copy code', onPress: copyCode },
    { text: 'Share', onPress: () => void share(input.shortMessage) },
    { text: 'More details', onPress: () => void share(input.fullMessage) },
    { text: 'Done', style: 'cancel' },
  ]);
}
