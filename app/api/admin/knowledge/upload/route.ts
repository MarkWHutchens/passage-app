import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { knowledgeIndex, KNOWLEDGE_NAMESPACE } from '@/lib/knowledge/client';
import { generateEmbedding } from '@/lib/pinecone/embeddings';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  console.log("=== UPLOAD START ===");
  
  try {
    // Step 1: Get form data
    console.log("Step 1: Getting form data...");
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const entryPointsStr = formData.get('entry_points') as string;
    const tagsStr = formData.get('tags') as string;
    const fileDescription = formData.get('file_description') as string;
    
    if (!file || !title || !type || !entryPointsStr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const entry_points = JSON.parse(entryPointsStr);
    const tags = tagsStr ? JSON.parse(tagsStr) : [];
    
    console.log("Step 1: ✓ Form data:", { 
      fileName: file.name, 
      title, 
      type, 
      entryPoints: entry_points.length,
      tags: tags.length,
      descriptionLength: fileDescription.length
    });
    
    // Step 2: Upload to Supabase
    console.log("Step 2: Uploading to Supabase...");
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('knowledge-files')
      .upload(fileName, buffer, {
        contentType: file.type
      });
    
    if (uploadError) {
      console.error("Supabase error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('knowledge-files')
      .getPublicUrl(uploadData.path);
    
    console.log("Step 2: ✓ Upload success:", publicUrl);
    
    // Step 3: Extract text content
    console.log("Step 3: Extracting text content...");
    let extractedText = '';
    
    // For PDF files, extract text using Claude
    if (file.type === 'application/pdf') {
      console.log("Step 3a: PDF detected, using Claude for extraction...");
      
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      
      const base64 = buffer.toString('base64');
      
      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_SONNET_MODEL || "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64
              }
            },
            {
              type: "text",
              text: "Extract all the text content from this PDF. Return only the extracted text, nothing else."
            }
          ] as any
        }]
      });
      
      const firstContent = response.content[0];
      extractedText = 'text' in firstContent ? firstContent.text : '';
      console.log("Step 3a: ✓ PDF text extracted via Claude, length:", extractedText.length);
    } else if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      // For text and markdown files, read the content directly
      console.log("Step 3b: Text/Markdown file detected, reading content...");
      extractedText = buffer.toString('utf-8');
      console.log("Step 3b: ✓ Text content read, length:", extractedText.length);
    } else {
      // For other files, use the description if provided
      extractedText = fileDescription?.trim() || '';
      console.log("Step 3c: Using provided description, length:", extractedText.length);
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ 
        error: 'No text content could be extracted from the file' 
      }, { status: 400 });
    }
    
    const content = extractedText.trim();
    console.log("Step 3: ✓ Content ready, length:", content.length);
    
    // Step 4: Create knowledge entries in Pinecone
    console.log("Step 4: Creating knowledge entries in Pinecone...");
    const ids = [];
    
    for (const entryPoint of entry_points) {
      console.log(`Step 4: Processing entry point: ${entryPoint}`);
      
      // Generate embedding
      console.log("  - Generating embedding...");
      const embedding = await generateEmbedding(content);
      
      // Generate unique ID
      const id = `knowledge-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Determine file type
      let fileType = 'document';
      if (file.type === 'application/pdf') fileType = 'pdf';
      else if (file.type.includes('word')) fileType = 'docx';
      else if (file.type === 'text/plain') fileType = 'txt';
      else if (file.type === 'text/markdown' || file.name.endsWith('.md')) fileType = 'md';
      
      // Build metadata
      const metadata = {
        type,
        entry_point: entryPoint,
        title,
        content,
        tags,
        file_url: publicUrl,
        file_name: file.name,
        file_type: fileType,
      };
      
      // Store in Pinecone
      console.log("  - Storing in Pinecone...");
      await knowledgeIndex.namespace(KNOWLEDGE_NAMESPACE).upsert([{
        id,
        values: embedding,
        metadata,
      }]);
      
      console.log(`  ✓ Knowledge added: ${id}`);
      ids.push(id);
    }
    
    console.log("=== UPLOAD SUCCESS ===");
    console.log("Created knowledge entries:", ids);
    
    return NextResponse.json({ success: true, ids });
    
  } catch (error: any) {
    console.error("=== UPLOAD ERROR ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
