import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  SlashCommandOptionsOnlyBuilder 
} from 'discord.js';

/**
 * Metadata for a bot command
 */
export interface CommandMetadata {
  /** Name of the command */
  name: string;
  /** Short description */
  description: string;
  /** Detailed usage information */
  usage: string;
  /** Example commands */
  examples: string[];
  /** Category for organization */
  category: 'dice' | 'utility' | 'character';
}

/**
 * A Discord bot command
 */
export interface Command {
  /** Discord slash command builder */
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  /** Command execution handler */
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  /** Metadata for help system */
  metadata: CommandMetadata;
}
