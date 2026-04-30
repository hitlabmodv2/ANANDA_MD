let handler = async(m, { conn, text, isAdmin }) => {
	if(!isAdmin) {
		await dfail('admin', m, conn) 
		return m.react("❌") 
		}
	let msg = JSON.parse(m.quoted.nativeFlowMessage.messageParamsJson).content
	await conn.copyNForward(m.sender, msg) 
	await m.react("✅") 
	}

handler.command = "antipornvalidatecontent";

export default handler;