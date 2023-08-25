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

        if (game.players.length >= 4) {
          await i.reply({ content: 'Game is full!', ephemeral: true });
          return
        }

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

        }
        await i.reply({ embeds: [tilesEmbed], components, ephemeral: true, files: [attachment] });
        const iReply: any = await i.fetchReply();

        if (game.players[game.turn]._id === i.user.id) {
          const collector = iReply.createMessageComponentCollector();

          const colButtons: ButtonBuilder[] = [];
          for (let i = 1; i <= 16; i++) {
            colButtons.push(new ButtonBuilder()
              .setLabel(`${i}`)
              .setCustomId(`${i}`)
              .setStyle(ButtonStyle.Secondary))
          }
          const buttonDiscard = new ButtonBuilder()
            .setLabel("Discard")
            .setCustomId("discard")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
          const buttonMove = new ButtonBuilder()
            .setLabel("Move")
            .setCustomId("move")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
          const buttonHelp = new ButtonBuilder()
            .setLabel("Help")
            .setCustomId("help")
            .setStyle(ButtonStyle.Success)
          const buttonCancel = new ButtonBuilder()
            .setLabel("Cancel")
            .setCustomId("cancel")
            .setStyle(ButtonStyle.Danger)
          const colRows: ActionRowBuilder<ButtonBuilder>[] = []
          for (let i = 0; i < 4; i++) {
            colRows.push(new ActionRowBuilder<ButtonBuilder>()
              .addComponents(colButtons.slice(i * 4, (i + 1) * 4)))
          }
          colRows[0].addComponents(buttonDiscard)
          colRows[1].addComponents(buttonMove)
          colRows[2].addComponents(buttonHelp)
          colRows[3].addComponents(buttonCancel)
          const rowButtonA = new ButtonBuilder()
            .setLabel("A")
            .setCustomId("a")
            .setStyle(ButtonStyle.Secondary)
          const rowButtonB = new ButtonBuilder()
            .setLabel("B")
            .setCustomId("b")
            .setStyle(ButtonStyle.Secondary)
          const rowButtonC = new ButtonBuilder()
            .setLabel("C")
            .setCustomId("c")
            .setStyle(ButtonStyle.Secondary)
          const rowButtonD = new ButtonBuilder()
            .setLabel("D")
            .setCustomId("d")
            .setStyle(ButtonStyle.Secondary)
          const rowButtonE = new ButtonBuilder()
            .setLabel("E")
            .setCustomId("e")
            .setStyle(ButtonStyle.Secondary)
          const rowButtons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(rowButtonA, rowButtonB, rowButtonC, rowButtonD, rowButtonE)
          let tileCol: number | undefined = undefined;
          let tileRow: "a" | "b" | "c" | "d" | "e" | undefined = undefined;
          collector.on('collect', async (buttonInt: any) => {
            if (
              ["a", "b", "c", "d", "e", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"]
              .includes(buttonInt.customId)
            ) {
              if (isNaN(parseInt(buttonInt.customId))) {
                rowButtonA.setStyle(ButtonStyle.Secondary)
                rowButtonB.setStyle(ButtonStyle.Secondary)
                rowButtonC.setStyle(ButtonStyle.Secondary)
                rowButtonD.setStyle(ButtonStyle.Secondary)
                rowButtonE.setStyle(ButtonStyle.Secondary)
                tileRow = buttonInt.customId as "a" | "b" | "c" | "d" | "e";
                switch (buttonInt.customId) {
                  case "a":
                    rowButtonA.setStyle(ButtonStyle.Success)
                    break;
                  case "b":
                    rowButtonB.setStyle(ButtonStyle.Success)
                    break;
                  case "c":
                    rowButtonC.setStyle(ButtonStyle.Success)
                    break;
                  case "d":
                    rowButtonD.setStyle(ButtonStyle.Success)
                    break;
                  case "e":
                    rowButtonE.setStyle(ButtonStyle.Success)
                    break;
                }
              } else {
                colButtons.forEach((button: ButtonBuilder) => {
                  button.setStyle(ButtonStyle.Secondary)
                });
                tileCol = parseInt(buttonInt.customId) - 1;
                colButtons[parseInt(buttonInt.customId) - 1].setStyle(ButtonStyle.Success)
              }
              if (tileCol !== undefined && tileRow !== undefined) {
                buttonDiscard.setDisabled(false)
                buttonMove.setDisabled(false)
              }
              await i.editReply({ components: [...colRows, rowButtons] });

              buttonInt.deferUpdate();
            }
            console.log(tileCol, tileRow)
            switch (buttonInt.customId) {
              case 'select-tile-button':
                await i.editReply({ components: [...colRows, rowButtons] });

                buttonInt.deferUpdate();
                break;
              case 'discard':
                break;
              case 'move':
                break;
              case 'help':
                break;
              case 'cancel':
                const button = new ButtonBuilder()
                  .setCustomId('select-tile-button')
                  .setLabel('Select Tile')
                  .setStyle(ButtonStyle.Primary)
    
                var row = new ActionRowBuilder<ButtonBuilder>()
                  .addComponents(button)
                i.editReply({ components: [row] });
                buttonInt.deferUpdate();
                break;
            }
          })
        }
      }
    })
  }
}