export interface EmailTemplateOutput {
  subject: string;
  html: string;
}

export interface IEmailTemplate<TParams> {
  render(params: TParams): EmailTemplateOutput;
}
