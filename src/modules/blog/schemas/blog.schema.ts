import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument  } from 'mongoose';

export type BlogDocument = HydratedDocument<Blog>;

@Schema({ _id: false }) 
export class Section {
  @Prop({ required: true, enum: ['title', 'paragraph', 'image', 'video', 'subtitle'] })
  type: string;

  @Prop({ required: true })
  content: string;
}

export const SectionSchema = SchemaFactory.createForClass(Section);

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  author: string;
  
  @Prop({ required: true })
  lectureTime: number;

  @Prop({required: true ,enum: ['Jardinage', 'Entretient','Transport', 'Bricolage', 'Électricité' , 'Éclairage' , 'Peinture' , 'Consctruction' , 'Plantes' , 'Nettoyage' , 'Décoration'] })
  category: string;

  @Prop()
  coverImageUrl: string;

 

  @Prop({ type: [SectionSchema], default: [] })
  sections: Section[];
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
