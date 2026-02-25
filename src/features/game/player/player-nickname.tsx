import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { useViewTransitionNavigate } from '@/hooks/ui/use-view-transition-navigate';
import { cn } from '@/lib/utilities';
import { LIMITS, nicknameSchema } from '@shared/validation';

const formSchema = z.object({
	nickname: nicknameSchema,
});

type FormData = z.infer<typeof formSchema>;
interface PlayerNicknameProperties {
	onJoin: (nickname: string) => void;
	isLoading: boolean;
}

export function PlayerNickname({ onJoin, isLoading }: PlayerNicknameProperties) {
	const navigate = useViewTransitionNavigate();
	const formReference = useRef<HTMLFormElement>(null);
	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isValid },
	} = useForm<FormData>({
		resolver: zodResolver(formSchema),
		mode: 'onChange',
		defaultValues: { nickname: '' },
	});

	const nickname = useWatch({ control, name: 'nickname' });

	const onSubmit = (data: FormData) => {
		onJoin(data.nickname);
	};

	return (
		<Card
			className={`
				relative w-full max-w-md border-4 border-black bg-zinc shadow-brutal
			`}
		>
			<CardHeader className="border-b-2 border-black text-center">
				<CardTitle className="font-display text-4xl text-white">Enter a Nickname</CardTitle>
			</CardHeader>
			<CardContent className="pt-6">
				<form ref={formReference} onSubmit={handleSubmit(onSubmit)} className={`space-y-6`}>
					<div className="relative">
						<input
							{...register('nickname')}
							type="text"
							placeholder="Your cool name"
							className={cn(
								'h-16 w-full rounded-xl px-4 text-center text-2xl font-bold',
								'border-2 border-black bg-black',
								`
									text-white
									placeholder:text-muted-foreground
								`,
								'focus:outline-none',
								'transition-all duration-200',
								errors.nickname && 'border-red bg-red/10',
							)}
							disabled={isLoading}
							maxLength={LIMITS.NICKNAME_MAX}
							autoComplete="off"
						/>
						{/* Invalid input tooltip - positioned above */}
						<div
							className={cn(
								'absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg px-3 py-2',
								'border border-red bg-red/90 text-sm text-white',
								'flex items-center gap-2 whitespace-nowrap',
								'transition-all duration-200',
								errors.nickname ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
							)}
						>
							<AlertCircle className="size-4" />
							{errors.nickname?.message}
						</div>
					</div>
					<Button type="submit" variant="dark-accent" size="xl" className="w-full" disabled={isLoading || !isValid || !nickname?.trim()}>
						{isLoading ? 'Joining...' : 'Join Game'}
					</Button>
					<Button
						type="button"
						variant="dark-ghost"
						onClick={() => navigate('/')}
						className={`
							w-full text-muted-foreground
							hover:bg-zinc/50 hover:text-white
						`}
					>
						Back to Home
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
