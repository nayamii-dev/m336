import { PrismaClient } from '@prisma/client';
import { Client, Events, IntentsBitField } from 'discord.js';

const db = new PrismaClient();
async function changePrefix(guild: string, prefix: string) {

    return db.settings.update({
        where: {
            guild_id: guild
        },
        data: {
            prefix
        }
    });
}

async function createPrefix(guild: string, prefix: string) {
    return db.settings.create({
        data: {
            guild_id: guild,
            prefix
        }
    });
}

async function getPrefix(guild: string) {
    return db.settings.findFirst({ where: { guild_id: guild } });
}


const client = new Client({ intents: [IntentsBitField.Flags.MessageContent] });

await client
    .on(Events.MessageCreate, async msg => {
        if (!msg.content || msg.author.bot || !msg.guild) return;
        if (msg.partial) await msg.fetch();

        const [command, ...args] = msg.content.trim().split(/\s+/);
        if (command === 'prefix') {
            const newPrefix = args[0];
            if (!newPrefix) {
                const existing = await getPrefix(msg.guild.id);
                if (existing) {
                    await msg.reply(`ℹ️ the current prefix here is ${existing}`);

                } else {
                    await msg.reply(`ℹ️ the current prefix here is ! (default) `);
                }
                return;
            }
            const existing = await getPrefix(msg.guild.id);
            if (!existing) {
                const settings = await createPrefix(msg.guild.id, newPrefix);
                await msg.reply(`ℹ️ changed prefix to ${settings.prefix}`);
            } else {
                const settings = await changePrefix(msg.guild.id, newPrefix);
                await msg.reply(`ℹ️ changed prefix to ${settings.prefix}`);
            }
            return;
        }
        return;
    })
    .on(Events.MessageUpdate, (o, m) => {
        if (o.content === m.content) return;
        //@ts-expect-error 
        client.emit(Events.MessageCreate, m);
    })

    .login(process.env.DISCORD_TOKEN);
