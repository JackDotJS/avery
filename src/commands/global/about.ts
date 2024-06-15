import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import pkg from "../../../package.json" assert { type: 'json' };

export const metadata = new SlashCommandBuilder()
  .setName(`about`)
  .setDescription(`Gives some basic information about FeatherBot.`);

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(`#F34848`)
    .setTitle(`FeatherBot ${pkg.version}`)
    .setDescription(`The best bot in the entire world.`)
    .addFields({
      name: `Source Code on GitHub`,
      value: `https://github.com/JackDotJS/featherbot`
    });

  await interaction.reply({
    embeds: [ embed ],
    ephemeral: true
  });
}