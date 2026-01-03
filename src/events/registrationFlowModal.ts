import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Client,
    Events,
    GuildMember,
    ModalSubmitInteraction,
    Routes,
    TextChannel,
} from "discord.js";

interface PendingVerification {
    userId: string;
    expiresAt: number;
}


const DEFATUL_EXPIRATION_MS = 2 * 60 * 1000;
const DEFAULT_CLEANUP_INTERVAL_MS = 5 * 1000;

const pendingVerifications = new Map<string, PendingVerification>();

const VERIFY_BUTTON_ID = "music-of-life-verify";
const VERIFY_MODAL_ID = "music-of-life-modal";
const ANSWER_INPUT_ID = "music-of-life-answer";
const QUESTION = "What Is The Music Of Life?";
const VERIFICATION_CHANNEL_ID = process.env.VERIFICATION_CHANNEL_ID;
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID;

export function buildModalComponents() {
    const button = new ButtonBuilder()
        .setCustomId(VERIFY_BUTTON_ID)
        .setLabel("Verificar")
        .setStyle(ButtonStyle.Primary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
    return { buttonRow } as const;
}

async function sendVerificationMessage(member: GuildMember) {
    if (!VERIFICATION_CHANNEL_ID) return;

    const channel = await member.client.channels.fetch(VERIFICATION_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) return;


    const { buttonRow } = buildModalComponents();

    const message = await (channel as TextChannel).send({
        content: `Bem-vindo ${member}. Clique no botão para verificar sua entrada.`,
        components: [buttonRow],
    });

    addNewVerification(message.id, member.id);
}

async function handleVerifyButton(interaction: ButtonInteraction) {
    const isValid = await validVerificationInteraction(interaction);
    if (!isValid) return;

    await interaction.client.rest.post(Routes.interactionCallback(interaction.id, interaction.token), {
        body: {
            type: 9,
            data: {
                custom_id: VERIFY_MODAL_ID,
                title: QUESTION,
                components: [
                    {
                        type: 18,
                        label: "Escolha a resposta correta:",
                        component: {
                            type: 3,
                            custom_id: ANSWER_INPUT_ID,
                            placeholder: "Escolha",
                            options: [
                                { label: "Screamming ?", value: "screamming" },
                                { label: "Um ... the lute ? No, drums!", value: "lute" },
                                { label: "Some Kind Of choir. With chanting", value: "choir" },
                                { label: "Silence, my brother", value: "silence" },
                            ],
                        },
                    },
                ],
            },
        },
    });
}

function startCleanupTask() {
    setInterval(() => {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [messageId, verification] of pendingVerifications.entries()) {
            if (now > verification.expiresAt) {
                pendingVerifications.delete(messageId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`[Cleanup] Removed ${cleanedCount} expired verification(s)`);
        }
    }, DEFAULT_CLEANUP_INTERVAL_MS);
}


function addNewVerification(messageId: string, userId: string) {
    pendingVerifications.set(messageId, {
        userId: userId,
        expiresAt: Date.now() + DEFATUL_EXPIRATION_MS,
    });
}

async function validVerificationInteraction(interaction: ButtonInteraction): Promise<boolean> {
    const verification = pendingVerifications.get(interaction.message.id);

    if (!verification) {
        await interaction.reply({
            content: "Esta verificação expirou ou não existe.",
            ephemeral: true,
        });
        return false;
    }

    if (verification.userId !== interaction.user.id) {
        await interaction.reply({
            content: "Esta verificação não é para você.",
            ephemeral: true,
        });
        return false;
    }

    if (Date.now() > verification.expiresAt) {
        pendingVerifications.delete(interaction.message.id);
        await interaction.reply({
            content: "Esta verificação expirou.",
            ephemeral: true,
        });
        return false;
    }

    return true;
}

async function handleModalSubmit(interaction: ModalSubmitInteraction) {
    // @ts-expect-error
    const answer = interaction.fields.fields.get(ANSWER_INPUT_ID)?.values?.[0] || ""
    if (answer === "silence") {
        handleSuccess(interaction);
    } else {
        await interaction.reply({ content: "Begone. Tente novamente para receber as roles básicas do servidor.", ephemeral: true });
    }
}

async function handleSuccess(interaction: ModalSubmitInteraction) {
    if (VERIFIED_ROLE_ID && interaction.member) {
        try {
            const guild = interaction.guild;
            if (guild) {
                const member = await guild.members.fetch(interaction.user.id);
                await member.roles.add(VERIFIED_ROLE_ID);
                await interaction.reply({ content: "Resposta correta! Welcome Home.", ephemeral: true });
            }
        } catch (error) {
            console.error('[Verification] Failed to add role:', error);
        }
    }
}
export function registerRegistrationFlow(client: Client) {
    client.on(Events.GuildMemberAdd, async (member) => {
        await sendVerificationMessage(member);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isButton() && interaction.customId === VERIFY_BUTTON_ID) {
            await handleVerifyButton(interaction);
            return;
        }

        if (interaction.isModalSubmit() && interaction.customId === VERIFY_MODAL_ID) {
            await handleModalSubmit(interaction);
        }
    });

    startCleanupTask();
}
