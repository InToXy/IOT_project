export const sendDiscordAlert = async (plantName: string, greenhouseId: string, score: number, issues: string[]) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl === 'YOUR_DISCORD_WEBHOOK_URL') {
        console.warn("Discord Webhook URL not configured.");
        return;
    }

    const message = {
        username: "EcoGuardian Bot",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/628/628283.png", // Plant icon
        embeds: [
            {
                title: `🚨 Alerte Santé : ${plantName}`,
                description: `La santé de votre plante est critique !`,
                color: 15158332, // Rouge
                fields: [
                    {
                        name: "Score de Bien-être",
                        value: `${score}%`,
                        inline: true
                    },
                    {
                        name: "Localisation",
                        value: `Serre ${greenhouseId}`,
                        inline: true
                    },
                    {
                        name: "Problèmes détectés",
                        value: issues.length > 0 ? issues.join('\n') : "Inconnu",
                        inline: false
                    }
                ],
                footer: {
                    text: "EcoGuardian - Surveillance en temps réel"
                },
                timestamp: new Date().toISOString()
            }
        ]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            console.error("Failed to send Discord alert:", response.statusText);
        } else {
            console.log("Discord alert sent successfully!");
        }
    } catch (error) {
        console.error("Error sending Discord alert:", error);
    }
};

export const sendInactivityAlert = async (plantName: string, greenhouseId: string, minutes: number) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl === 'YOUR_DISCORD_WEBHOOK_URL') {
        console.warn("Discord Webhook URL not configured.");
        return;
    }

    const message = {
        username: "EcoGuardian Bot",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/628/628283.png", // Plant icon
        embeds: [
            {
                title: `⚠️ Alerte Inactivité : ${plantName}`,
                description: `Aucune nouvelle donnée reçue depuis plus de ${minutes} minutes.`,
                color: 9807270, // Gris/Grisâtre (Decimal for #95a5a6)
                fields: [
                    {
                        name: "Dernière activité",
                        value: `Il y a > ${minutes} min`,
                        inline: true
                    },
                    {
                        name: "Localisation",
                        value: `Serre ${greenhouseId}`,
                        inline: true
                    },
                    {
                        name: "Status",
                        value: "Hors ligne / Capteur déconnecté ?",
                        inline: false
                    }
                ],
                footer: {
                    text: "EcoGuardian - Surveillance système"
                },
                timestamp: new Date().toISOString()
            }
        ]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            console.error("Failed to send Discord inactivity alert:", response.statusText);
        } else {
            console.log("Discord inactivity alert sent successfully!");
        }
    } catch (error) {
        console.error("Error sending Discord inactivity alert:", error);
    }
};
