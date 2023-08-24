import { Listener, Events } from '@sapphire/framework';
import { Client } from 'discord.js';
import { Ansi } from "../util/ansi"

export class ReadyListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: Events.ClientReady,
    });
  }
  public run(client: Client) {
    const { username, id, discriminator } = client.user!;
    this.container.logger.info(Ansi.Colors.LightGreen(`Successfully logged in as ${Ansi.Formats.Bold(`${username}#${discriminator}`)} (${Ansi.Formats.Italic(id)})`));
  }
}