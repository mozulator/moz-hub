const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function extractPaymentsFromPDF(pdfPath) {
  // Read the prompt
  const prompt = fs.readFileSync(path.join(__dirname, 'prompt.md'), 'utf-8');
  
  // Read PDF as base64
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64PDF = pdfBuffer.toString('base64');
  
  console.log('Sending PDF to OpenAI for analysis...');
  console.log(`PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'file',
              file: {
                filename: path.basename(pdfPath),
                file_data: `data:application/pdf;base64,${base64PDF}`
              }
            }
          ]
        }
      ],
      max_tokens: 16000,
      temperature: 0.1
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Try to parse as JSON (remove markdown code blocks if present)
  let jsonContent = content;
  if (content.includes('```json')) {
    jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (content.includes('```')) {
    jsonContent = content.replace(/```\n?/g, '');
  }
  
  try {
    const parsed = JSON.parse(jsonContent.trim());
    return parsed;
  } catch (e) {
    console.log('Raw response:', content);
    throw new Error('Failed to parse JSON response from OpenAI');
  }
}

async function main() {
  const pdfPath = process.argv[2] || path.join(__dirname, '9001032281892.11.2025.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    process.exit(1);
  }
  
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }
  
  console.log(`Processing: ${pdfPath}`);
  
  try {
    const result = await extractPaymentsFromPDF(pdfPath);
    
    // Save the result
    const outputPath = pdfPath.replace('.pdf', '-extracted.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log('\n✅ Extraction complete!');
    console.log(`📄 Output saved to: ${outputPath}`);
    console.log(`📊 Total transactions found: ${result.payments?.length || 0}`);
    
    if (result.metadata) {
      console.log('\n📋 Document Metadata:');
      console.log(`   Type: ${result.metadata.documentType || 'Unknown'}`);
      console.log(`   Period: ${result.metadata.statementPeriod || 'Unknown'}`);
      console.log(`   Currency: ${result.metadata.currency || 'Unknown'}`);
    }
    
    if (result.payments && result.payments.length > 0) {
      console.log('\n💰 Sample payments:');
      result.payments.slice(0, 5).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.date} | ${p.recipient} | ${p.amount}`);
      });
      if (result.payments.length > 5) {
        console.log(`   ... and ${result.payments.length - 5} more`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

