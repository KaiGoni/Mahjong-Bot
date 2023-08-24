import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, SelectMenuBuilder, StringSelectMenuBuilder } from "@discordjs/builders";
import { Command, ChatInputCommand } from "@sapphire/framework";
import gameStatusSchema from "@schemas/game-status-schema";
const styles = {
  'wenzhou': '温州(Wenzhou)'
}
import { deck, generateDeck } from "@util/generatedeck";
import createCanvas from "@util/createCanvas";
import { AttachmentBuilder, ButtonInteraction, ButtonStyle, StageChannel } from "discord.js";
function removeDuplicates(array: any[]) {
  return array.filter((a, b) => array.indexOf(a) === b)
}

export class StartCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      requiredUserPermissions: ["SendMessages"],
      requiredClientPermissions: ["SendMessages"],
      preconditions: ["GuildOnly"]
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("start")
          .setDescription("Start a game of Mahjong")
          .addStringOption((option) =>
            option
              .setName("style")
              .setDescription("Style of Mahjong to play")
              .setRequired(true)
              .addChoices(
                { name: "温州(Wenzhou)", value: "wenzhou" }
              )
          ),
      // { guildIds: [ 'TESTID' ] }, // Uncomment this line to register the command in a specific guild
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (interaction.channel instanceof StageChannel) return interaction.reply("no");
    const style = interaction.options.getString('style') as "wenzhou";

    await gameStatusSchema.create({
      _id: interaction.id,
      style: style,
      modifiers: {
        wildcard: deck.styles[style].modifiers.wildcard,
      },
      players: [
        {
          _id: interaction.user.id,
          hand: [],
        },
      ],
      deck: [],
      discard: [],
      turn: 0,
    })

    const embed = new EmbedBuilder() // Create embed
      .setTitle('Game Creating')
      .addFields(
        { name: 'Created by', value: `<@${interaction.user.id}>` },
        { name: 'Style', value: styles[style] },
        { name: 'Players', value: `Player 1: <@${interaction.user.id}>\nPlayer 2: -----\nPlayer 3: -----\nPlayer 4: -----` },
      )
      .setFooter({ text: `Game ID: ${interaction.id}` })
      .setColor(0x228B22)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>() // Create action row for join button
      .addComponents(
        new ButtonBuilder()
          .setCustomId('join')
          .setLabel('Join Game')
          .setStyle(ButtonStyle.Primary),
      );
    const interactionReply = await interaction.channel!.send({ embeds: [embed], components: [row] }); // Send embed
    interaction.reply({ content: "Game created!", ephemeral: true });

    const collector = interactionReply.createMessageComponentCollector();

    collector.on('collect', async (i: ButtonInteraction) => {
      const game = await gameStatusSchema.findById(i.message.embeds[0].footer?.text?.split(' ')[2]);
      if (i.customId === 'join') {
        // if (i.user.id === interaction.user.id) { // Checks if user can join
        //   await i.reply({ content: 'You cannot join your own game!', ephemeral: true });
        //   return
        // }

        // if (game.players.length >= 4) {
        //   await i.reply({ content: 'Game is full!', ephemeral: true });
        //   return
        // }

        // if (game.players.find((player: any) => player._id === i.user.id)) {
        //   await i.reply({ content: 'You are already in this game!', ephemeral: true });
        //   return
        // }
        if (game.players.length < 4) { // Add player to game
          const embed = i.message.embeds[0];
          game.players.push({
            _id: i.user.id,
            hand: [],
          });
          await game.updateOne(game);
          embed.fields[2].value = `Player 1: ${game.players[0] ? `<@${game.players[0]._id}>` : "-----"}\nPlayer 2: ${game.players[1] ? `<@${game.players[1]._id}>` : "-----"}\nPlayer 3: ${game.players[2] ? `<@${game.players[2]._id}>` : "-----"}\nPlayer 4: ${game.players[3] ? `<@${game.players[3]._id}>` : "-----"}`;
          await i.update({ embeds: [embed] });
        }
        if (game.players.length === 4) { // Game starts
          const { deck, hands, wildcard } = generateDeck(game.style);
          await game.updateOne({
            $set: {
              deck,
              players: game.players.map((player: any, index: any) => {
                player.hand = hands[index];
                return player;
              }),
              modifiers: {
                wildcard,
              },
            },
          });

          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('view-game')
                .setLabel('View Game')
                .setStyle(ButtonStyle.Primary),
            );

          await i.message.edit({ components: [row] });
        }
      } else if (i.customId === 'view-game') {
        if (!game.players.find((player: any) => player._id === i.user.id)) {
          await i.reply({ content: 'You are not in this game!', ephemeral: true });
          return
        }
        const currentPlayer = interaction.guild?.members.cache.get(game.players[game.turn]._id);
        const canvas = await createCanvas({
          turn: game.turn,
          players: game.players,
          user: game.players.findIndex((player: any) => player._id === i.user.id),
        });
        const attachment = new AttachmentBuilder(canvas.encodeSync("png"), { name: "game.png" })
        const tilesEmbed = new EmbedBuilder()
          .setTitle(`${currentPlayer?.nickname || currentPlayer?.user.username}` + "'s Turn")
          .setDescription(`<@${game.players[game.turn]._id}>` + '➡️' + `<@${game.players[(game.turn + 1) % 4]._id}>` + '➡️' + `<@${game.players[(game.turn + 2) % 4]._id}>` + '➡️' + `<@${game.players[(game.turn + 3) % 4]._id}>`)
          .addFields(
            { name: 'Your Hand', value: game.players.find((player: any) => player._id === i.user.id).hand.map((tile: any) => `\\${deck.tileEmojis[tile as keyof typeof deck.tileEmojis]} ${tile}`).join('\n') },
            { name: 'Wild Card', value: deck.tileEmojis[game.modifiers.wildcard as keyof typeof deck.tileEmojis] + game.modifiers.wildcard },
            { name: 'Discard Pile', value: deck.tileEmojis[game.discard[game.discard.length - 1] as keyof typeof deck.tileEmojis] + game.discard[game.discard.length - 1] || 'Empty' },
          )
          .setImage('attachment://game.png')
          .setColor(0x800000)

        var components: ActionRowBuilder<ButtonBuilder>[] = []

        if (game.players[game.turn]._id === i.user.id) {
          const button = new ButtonBuilder()
            .setCustomId('select-tile-button')
            .setLabel('Select Tile')
            .setStyle(ButtonStyle.Primary)

          var row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(button)
          components.push(row)

          var select = new StringSelectMenuBuilder()
            .setCustomId('play-tile')
            .setPlaceholder('Select a tile to play')
            .addOptions(removeDuplicates(game.players.find((player: any) => player._id === i.user.id).hand).map((tile: any) => {
              return {
                label: `${deck.tileEmojis[tile as keyof typeof deck.tileEmojis]} ${tile}`,
                value: tile,
              }
            }))

          var selectRow = new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(select)
        }

        await i.reply({ embeds: [tilesEmbed], components, ephemeral: true });
        const iReply: any = await i.fetchReply();

        if (game.players[game.turn]._id === i.user.id) {
          const collector = iReply.createMessageComponentCollector();

          collector.on('collect', async (buttonInt: any) => {
            switch (buttonInt.customId) {
              case 'select-tile-button':

                await i.editReply({ components: [selectRow] });

                buttonInt.deferUpdate();
                break;
              case 'play-tile':
                // console.log(buttonInt.values[0])

                const selectDisabled = new SelectMenuBuilder()
                  .setCustomId('play-tile')
                  .setPlaceholder('Select a tile to play')
                  .addOptions(removeDuplicates(game.players.find((player: any) => player._id === i.user.id).hand).map((tile: any) => {
                    let res: any = {
                      label: `${deck.tileEmojis[tile as keyof typeof deck.tileEmojis]} ${tile}`,
                      value: tile,
                    }
                    if (tile === buttonInt.values[0]) {
                      res.default = true
                    }
                    return res
                  }))
                  .setDisabled(true)

                const row1 = new ActionRowBuilder<SelectMenuBuilder>()
                  .addComponents(selectDisabled)

                const playTileButton = new ButtonBuilder()
                  .setCustomId('play-tile-button')
                  .setLabel('Play Tile')
                  .setStyle(ButtonStyle.Primary)

                const cancelButton = new ButtonBuilder()
                  .setCustomId('cancel-button')
                  .setLabel('Cancel')
                  .setStyle(ButtonStyle.Danger)

                const row2 = new ActionRowBuilder<ButtonBuilder>()
                  .addComponents(playTileButton, cancelButton)

                i.editReply({ embeds: [tilesEmbed], components: [row1, row2] })

                buttonInt.deferUpdate();
                break;
              case 'play-tile-button':
                
                break;
              case 'cancel-button':
                i.editReply({ embeds: [tilesEmbed], components: [row] })
                buttonInt.deferUpdate();
                break;
            }
          })
        }
      }
    })
  }
}