import './globals.css';
import { ReactNode } from 'react';


export const metadata = {
title: 'Utsav Patel — Portfolio',
description: 'Interactive 3D portfolio with red/black theme and polka background',
};


export default function RootLayout({ children }: { children: ReactNode }) {
return (
<html lang="en">
<body className="polka text-brand-black selection:bg-brand-red/30">
{children}
</body>
</html>
);
}