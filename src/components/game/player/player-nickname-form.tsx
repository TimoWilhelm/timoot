import { useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LIMITS, nicknameSchema } from '@shared/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
	nickname: nicknameSchema,
});

type FormData = z.infer<typeof formSchema>;
interface PlayerNicknameFormProperties {
	onJoin: (nickname: string) => void;
	isLoading: boolean;
}
export function PlayerNicknameForm({ onJoin, isLoading }: PlayerNicknameFormProperties) {
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
		<div
			className={`
				relative flex min-h-dvh w-full items-center justify-center overflow-auto
				bg-slate-900 p-4
			`}
		>
			{/* Decorative grid */}
			<div
				className={`
					absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)]
					bg-size-[20px_20px] opacity-30
				`}
			/>

			<Card
				className={`
					relative w-full max-w-md animate-scale-in border-4 border-white/20
					bg-slate-800 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]
				`}
			>
				<CardHeader className="border-b-2 border-white/10 text-center">
					<CardTitle className="font-display text-4xl text-white">Enter a Nickname</CardTitle>
				</CardHeader>
				<CardContent className="pt-6">
					<form ref={formReference} onSubmit={handleSubmit(onSubmit)} className={`space-y-6`}>
						<div>
							<Input
								{...register('nickname')}
								placeholder="Your cool name"
								className={`
									h-16 border-2 border-white/30 bg-slate-700 text-center text-2xl
									font-bold text-white shadow-[inset_3px_3px_0px_0px_rgba(0,0,0,0.3)]
									placeholder:text-slate-400
									focus:border-quiz-orange focus:ring-quiz-orange
								`}
								disabled={isLoading}
								maxLength={LIMITS.NICKNAME_MAX}
								autoComplete="off"
							/>
							{errors.nickname && <p className="mt-2 text-center text-sm font-bold text-red-400">{errors.nickname.message}</p>}
						</div>
						<Button
							type="submit"
							className={`
								w-full border-4 border-white/20 bg-quiz-orange py-6 text-xl font-black
								uppercase shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] transition-all
								hover:-translate-y-px hover:bg-quiz-orange
								hover:shadow-[9px_9px_0px_0px_rgba(255,255,255,0.1)]
								active:translate-y-0
								active:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]
							`}
							size="lg"
							disabled={isLoading || !isValid || !nickname?.trim()}
						>
							{isLoading ? 'Joining...' : 'Join Game'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
