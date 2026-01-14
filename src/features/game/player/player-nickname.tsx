import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { Input } from '@/components/input';
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
				relative w-full max-w-md border-4 border-slate bg-black shadow-brutal-slate
			`}
		>
			<CardHeader className="border-b-2 border-slate text-center">
				<CardTitle className="font-display text-4xl text-white">Enter a Nickname</CardTitle>
			</CardHeader>
			<CardContent className="pt-6">
				<form ref={formReference} onSubmit={handleSubmit(onSubmit)} className={`space-y-6`}>
					<div>
						<Input
							{...register('nickname')}
							placeholder="Your cool name"
							className={`
								h-16 border-white bg-black text-center text-2xl font-bold text-white
								placeholder:text-muted-foreground
								focus:border-orange focus:ring-offset-0
							`}
							disabled={isLoading}
							maxLength={LIMITS.NICKNAME_MAX}
							autoComplete="off"
						/>
						{errors.nickname && <p className="mt-2 text-center text-sm font-bold text-red">{errors.nickname.message}</p>}
					</div>
					<Button type="submit" variant="dark-accent" size="xl" className="w-full" disabled={isLoading || !isValid || !nickname?.trim()}>
						{isLoading ? 'Joining...' : 'Join Game'}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
