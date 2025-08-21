'use client'

import { Button } from '../ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import type React from 'react'
import { createContext, use } from 'react'

interface ActionContextValue {
	value?: string
	onValueChange?: (value: string) => void
}

const ActionContext = createContext<ActionContextValue | null>(null)

const useActionContext = () => {
	const context = use(ActionContext)
	if (!context) {
		throw new Error('Action components must be used within an Action provider')
	}
	return context
}

interface ActionProps extends React.ComponentProps<typeof DropdownMenuTrigger> {
	icon?: LucideIcon
	value?: string
	onValueChange?: (value: string) => void
}

interface ActionItemProps {
	children?: React.ReactNode
	label?: string
	icon?: LucideIcon
	variant?: React.ComponentProps<typeof DropdownMenuItem>['variant']
	type?: 'separator' | 'sub' | 'group'
	selectable?: boolean
	value?: string
	shortcut?: string
	onAction?: () => void
}

function ActionRoot({
	children,
	icon: Icon,
	value,
	onValueChange,
  ...props
}: ActionProps) {
	return (
		<ActionContext.Provider value={{ value, onValueChange }}>
			<DropdownMenu >
				<DropdownMenuTrigger asChild {...props}>
					<Button
						variant='ghost'
						size='icon'
						className='size-8 data-[state=open]:bg-muted'
					>
						{Icon ? (
							<Icon className='size-5' />
						) : (
							<MoreHorizontal className='size-5' />
						)}
						<span className='sr-only'>Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-[160px]'>
					{children}
				</DropdownMenuContent>
			</DropdownMenu>
		</ActionContext.Provider>
	)
}

function ActionItem({
	children,
	label,
	icon: Icon,
	variant,
	type,
	selectable,
	value,
	shortcut,
	onAction,
}: ActionItemProps) {
	const { value: contextValue, onValueChange } = useActionContext()

	if (type === 'separator') {
		return <DropdownMenuSeparator />
	}

	if (type === 'group' && children) {
		return <DropdownMenuGroup>{children}</DropdownMenuGroup>
	}

	if (type === 'sub' && children) {
		return (
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>
					{Icon && <Icon className='mr-2' />}
					{label}
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent>
					{selectable ? (
						<DropdownMenuRadioGroup
							value={contextValue}
							onValueChange={onValueChange}
						>
							{children}
						</DropdownMenuRadioGroup>
					) : (
						children
					)}
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		)
	}

	if (selectable && value) {
		return (
			<DropdownMenuRadioItem value={value}>
				{Icon && <Icon className='mr-2' />}
				{label}
				{shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
			</DropdownMenuRadioItem>
		)
	}

	return (
		<DropdownMenuItem variant={variant} onClick={onAction}>
			{Icon && <Icon className='mr-2' />}
			{label}
			{shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
		</DropdownMenuItem>
	)
}

// Export compound component
export const Action = Object.assign(ActionRoot, {
	Item: ActionItem,
})

// Export legacy Actions component for backward compatibility
interface ActionItem {
	label: string
	icon?: LucideIcon
	variant?: React.ComponentProps<typeof DropdownMenuItem>['variant']
	type?: 'separator' | 'sub' | 'group'
	selectable?: boolean
	value?: string
	items?: ActionItem[]
	shortcut?: string
	handleAction?: () => void
}

interface ActionsProps {
	icon?: LucideIcon
	items: ActionItem[]
	selectedValue?: string
	onValueChange?: (value: string) => void
}

export function Actions({
	items,
	icon: Icon,
	selectedValue,
	onValueChange,
}: ActionsProps) {
	const renderItem = (item: ActionItem) => {
		if (item.type === 'separator') {
			return <DropdownMenuSeparator key={item.label} />
		}

		if (item.type === 'sub' && item.items) {
			return (
				<DropdownMenuSub key={item.label}>
					<DropdownMenuSubTrigger>{item.label}</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						{item.selectable ? (
							<DropdownMenuRadioGroup
								value={selectedValue}
								onValueChange={onValueChange}
							>
								{item.items.map((subItem) => (
									<DropdownMenuRadioItem
										key={subItem.value}
										value={subItem.value || ''}
									>
										{subItem.icon && <subItem.icon className='mr-2' />}
										{subItem.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						) : (
							item.items.map(renderItem)
						)}
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			)
		}

		if (item.type === 'group' && item.items) {
			return (
				<DropdownMenuGroup key={item.label}>
					{item.items.map(renderItem)}
				</DropdownMenuGroup>
			)
		}

		return (
			<DropdownMenuItem
				key={item.label}
				variant={item.variant}
				onClick={item.handleAction}
			>
				{item.icon && <item.icon className='mr-2' />}
				{item.label}
				{item.shortcut && (
					<DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
				)}
			</DropdownMenuItem>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='ghost'
					size='icon'
					className='size-8 data-[state=open]:bg-muted'
				>
					{Icon ? (
						<Icon className='size-5' />
					) : (
						<MoreHorizontal className='size-5' />
					)}
					<span className='sr-only'>Open menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-[160px]'>
				{items.map(renderItem)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
