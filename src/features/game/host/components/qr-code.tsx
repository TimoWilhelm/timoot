import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProperties {
	value: string;
	size?: number;
}
export function QRCode({ value, size = 128 }: QRCodeProperties) {
	return <QRCodeSVG value={value} size={size} marginSize={2} aria-label="QR Code" />;
}
